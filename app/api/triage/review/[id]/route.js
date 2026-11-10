import { NextResponse } from 'next/server';
import { mapTriageAssessment } from '@/lib/triage-assessments';
import { applyTriageReview, createTriageReviewPayload } from '@/lib/triage-review';
import { getAuthenticatedContext } from '@/lib/supabase/server';

export async function PATCH(request, { params }) {
  const access = await getAuthenticatedContext({ includeLegacyRole: false });
  if (!access.configured) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }
  if (access.error) {
    return NextResponse.json({ error: 'Unable to verify account access.' }, { status: 503 });
  }
  if (!access.user) {
    return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (typeof id !== 'string' || !/^TRG-[A-Z0-9]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'A valid triage assessment ID is required.' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'A valid JSON request is required.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid JSON object is required.' }, { status: 400 });
    }

    const validLevels = ['RED', 'YELLOW', 'ORANGE', 'GREEN', 'BLUE'];
    const triageLevel = body.triageLevel ? String(body.triageLevel).toUpperCase().trim() : undefined;
    if (triageLevel && !validLevels.includes(triageLevel)) {
      return NextResponse.json({ error: 'Invalid triage level. Must be RED, ORANGE/YELLOW, or GREEN/BLUE.' }, { status: 400 });
    }

    const reviewPayload = createTriageReviewPayload(body, access.user.id);
    const { data: row, error: loadError } = await access.supabase
      .from('triage_assessments')
      .select('*')
      .eq('id', id.toUpperCase())
      .maybeSingle();

    if (loadError) {
      console.error('Unable to load triage assessment for review:', {
        code: loadError.code || null,
        status: loadError.status || null,
        message: loadError.message || 'No error message was provided.',
      });
      return NextResponse.json({ error: 'Unable to load the triage assessment.' }, { status: 503 });
    }
    if (!row) {
      return NextResponse.json({ error: 'Triage assessment not found.' }, { status: 404 });
    }
    if (!row.hospital_id || !row.department_id) {
      return NextResponse.json(
        { error: 'Private patient assessments cannot be reviewed through the clinical queue.' },
        { status: 403 }
      );
    }

    const reviewedRecord = applyTriageReview(mapTriageAssessment(row), reviewPayload);
    const recordData = {
      ...reviewedRecord,
      reviewedBy: '',
      reviewedAt: null,
    };
    const { data: updatedRow, error: updateError } = await access.supabase
      .from('triage_assessments')
      .update({
        record_data: recordData,
        triage_level: reviewedRecord.triageLevel,
        priority_score: reviewedRecord.priorityScore,
        status: 'DOCTOR_REVIEWED',
        doctor_notes: reviewedRecord.doctorNotes,
        was_overridden: reviewedRecord.wasOverridden,
      })
      .eq('id', id.toUpperCase())
      .select('*')
      .maybeSingle();

    if (updateError) {
      console.error('Unable to persist clinical triage review:', {
        code: updateError.code || null,
        status: updateError.status || null,
        message: updateError.message || 'No error message was provided.',
      });
      return NextResponse.json(
        { error: updateError.code === '42501'
          ? 'This account no longer has access to review this assessment.'
          : 'Unable to save the clinical review.' },
        { status: updateError.code === '42501' ? 403 : 503 }
      );
    }
    if (!updatedRow) {
      return NextResponse.json(
        { error: 'This account no longer has access to review this assessment.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Human-in-the-loop clinical review recorded successfully.',
      data: mapTriageAssessment(updatedRow)
    });
  } catch (err) {
    console.error('Server error recording doctor triage review:', err?.message || err);
    return NextResponse.json({ error: 'Internal Server Error recording triage review.' }, { status: 500 });
  }
}
