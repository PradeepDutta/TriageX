import { NextResponse } from 'next/server';
import { mapTriageAssessment } from '@/lib/triage-assessments';
import { getAuthenticatedContext } from '@/lib/supabase/server';

export async function GET(request, { params }) {
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

    const { data: row, error } = await access.supabase
      .from('triage_assessments')
      .select('*')
      .eq('id', id.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('Unable to fetch authorized triage assessment:', {
        code: error.code || null,
        status: error.status || null,
        message: error.message || 'No error message was provided.',
      });
      return NextResponse.json({ error: 'Unable to load the triage assessment.' }, { status: 503 });
    }
    if (!row) {
      return NextResponse.json({ error: 'Triage assessment not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: mapTriageAssessment(row)
    });
  } catch (err) {
    console.error('Error fetching patient triage record:', err?.message || err);
    return NextResponse.json({ error: 'Unable to load the triage assessment.' }, { status: 500 });
  }
}
