import { NextResponse } from 'next/server';
import { listTriageAssessments } from '@/lib/triage-assessments';
import { getAuthenticatedContext, requireTriageAssessmentAccess } from '@/lib/supabase/server';

export async function GET(request) {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  if (!context.configured) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }
  if (context.error) {
    return NextResponse.json({ error: 'Unable to verify account access.' }, { status: 503 });
  }
  if (!context.user) {
    return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get('hospitalId');
  const departmentId = searchParams.get('departmentId');
  if (!hospitalId || !departmentId) {
    return NextResponse.json(
      { error: 'An authorized hospital and department assignment are required.' },
      { status: 400 }
    );
  }

  const access = await requireTriageAssessmentAccess(hospitalId, departmentId, { context });
  if (access.response) return access.response;

  try {
    const triageLevel = searchParams.get('triageLevel') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const validLevels = ['ALL', 'RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'];
    const validStatuses = ['ALL', 'PENDING_DOCTOR_APPROVAL', 'DOCTOR_REVIEWED'];
    if (!validLevels.includes(triageLevel) || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'A triage or status filter is invalid.' }, { status: 400 });
    }

    const filters = {
      hospitalId,
      departmentId,
      facilityType: searchParams.get('facilityType') || 'ALL',
      triageLevel,
      status,
      search: (searchParams.get('search') || '').slice(0, 100),
    };

    const { data: queue, error, tooMany } = await listTriageAssessments(access.supabase, filters);
    if (tooMany) {
      return NextResponse.json(
        { error: 'The selected queue contains more than 1,000 cases. Apply filters before loading it.' },
        { status: 413 }
      );
    }
    if (error) {
      console.error('Unable to fetch authorized triage assessments:', {
        code: error.code || null,
        status: error.status || null,
        message: error.message || 'No error message was provided.',
      });
      return NextResponse.json(
        { error: 'Unable to load the clinical queue.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      count: queue.length,
      filters,
      data: queue
    });
  } catch (err) {
    console.error('Error fetching triage queue:', err?.message || err);
    return NextResponse.json({ error: 'Unable to load the clinical queue.' }, { status: 500 });
  }
}
