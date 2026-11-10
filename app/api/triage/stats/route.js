import { NextResponse } from 'next/server';
import { getTriageAssessmentStats, listTriageAssessments } from '@/lib/triage-assessments';
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
    const { data: records, error, tooMany } = await listTriageAssessments(access.supabase, {
      hospitalId,
      departmentId,
    });
    if (tooMany) {
      return NextResponse.json(
        { error: 'The selected assignment contains more than 1,000 cases; statistics are incomplete.' },
        { status: 413 }
      );
    }
    if (error) {
      console.error('Unable to fetch authorized assessment statistics:', {
        code: error.code || null,
        status: error.status || null,
        message: error.message || 'No error message was provided.',
      });
      return NextResponse.json({ error: 'Unable to load clinical statistics.' }, { status: 503 });
    }

    const stats = getTriageAssessmentStats(records);
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error fetching facility triage stats:', err?.message || err);
    return NextResponse.json({ error: 'Unable to load clinical statistics.' }, { status: 500 });
  }
}
