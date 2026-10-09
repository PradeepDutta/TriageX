import { NextResponse } from 'next/server';
import { reviewPatientTriage } from '@/lib/triage-store';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string' || !/^TRG-\d+$/i.test(id.trim())) {
      return NextResponse.json({ error: 'A valid patient triage ID (e.g. TRG-1861) is required.' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'A valid JSON request is required.' }, { status: 400 });
    }

    const validLevels = ['RED', 'YELLOW', 'ORANGE', 'GREEN', 'BLUE'];
    const triageLevel = body.triageLevel ? String(body.triageLevel).toUpperCase().trim() : undefined;
    if (triageLevel && !validLevels.includes(triageLevel)) {
      return NextResponse.json({ error: 'Invalid triage level. Must be RED, ORANGE/YELLOW, or GREEN/BLUE.' }, { status: 400 });
    }

    const reviewPayload = {
      triageLevel,
      doctorNotes: typeof body.doctorNotes === 'string' ? body.doctorNotes.trim().slice(0, 2000) : '',
      reviewedBy: typeof body.reviewedBy === 'string' ? body.reviewedBy.trim().slice(0, 100) : 'Dr. Staff Medical Officer',
      suggestedDepartment: typeof body.suggestedDepartment === 'string' ? body.suggestedDepartment.trim().slice(0, 100) : undefined,
      status: 'DOCTOR_REVIEWED',
    };

    const updatedPatient = reviewPatientTriage(id.trim(), reviewPayload);

    if (!updatedPatient) {
      return NextResponse.json({ error: 'Patient record not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Human-in-the-loop clinical review recorded successfully.',
      data: updatedPatient
    });
  } catch (err) {
    console.error('Server error recording doctor triage review:', err?.message || err);
    return NextResponse.json({ error: 'Internal Server Error recording triage review.' }, { status: 500 });
  }
}

