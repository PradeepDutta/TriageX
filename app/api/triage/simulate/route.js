import { NextResponse } from 'next/server';
import { createTriageAssessmentRow, insertTriageAssessment, listTriageAssessments } from '@/lib/triage-assessments';
import { createSimulationProfile, isSimulatedPatient } from '@/lib/triage-simulation';
import { getAuthenticatedContext, requireTriageAssessmentAccess } from '@/lib/supabase/server';

export async function POST(request) {
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
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'A valid JSON request is required.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid JSON object is required.' }, { status: 400 });
    }
    const { hospitalId, departmentId } = body;
    const tenantAccess = await requireTriageAssessmentAccess(hospitalId, departmentId, {
      create: true,
      context: access,
    });
    if (tenantAccess.response) return tenantAccess.response;

    const { data: hospital, error: hospitalError } = await access.supabase
      .from('hospitals')
      .select('id, name')
      .eq('id', hospitalId)
      .eq('status', 'active')
      .maybeSingle();
    if (hospitalError) {
      console.error('Unable to verify simulation hospital:', {
        code: hospitalError.code || null,
        status: hospitalError.status || null,
        message: hospitalError.message || 'No error message was provided.',
      });
      return NextResponse.json({ error: 'Unable to verify the selected hospital.' }, { status: 503 });
    }
    if (!hospital) {
      return NextResponse.json({ error: 'The selected hospital is unavailable to this account.' }, { status: 403 });
    }

    const { data: patients, error: queueError } = await listTriageAssessments(access.supabase, {
      hospitalId,
      departmentId,
    });
    if (queueError) {
      console.error('Unable to load tenant cases for simulation:', {
        code: queueError.code || null,
        status: queueError.status || null,
        message: queueError.message || 'No error message was provided.',
      });
      return NextResponse.json({ error: 'Unable to generate a simulation for this assignment.' }, { status: 503 });
    }

    const simulationCount = patients.filter(isSimulatedPatient).length;
    const profile = createSimulationProfile(patients, simulationCount);

    const simulatedVitals = {
      pulse: Math.floor(70 + Math.random() * 60),
      systolicBP: Math.floor(105 + Math.random() * 70),
      diastolicBP: Math.floor(65 + Math.random() * 45),
      spo2: Math.floor(86 + Math.random() * 13),
      temperature: Number((98.2 + Math.random() * 5).toFixed(1)),
      respirationRate: Math.floor(14 + Math.random() * 14)
    };

    const assessment = createTriageAssessmentRow({
      actorUserId: access.user.id,
      hospital,
      departmentId,
      isSimulated: true,
      intakeData: {
        ...profile,
        vitals: simulatedVitals,
        imageInput: Math.random() > 0.5
          ? { fileName: 'simulated_trauma_photo.jpg', description: 'Illustrative scenario; no image analysis performed.' }
          : null,
        reportText: Math.random() > 0.6 ? 'Synthetic lab scenario; not a real patient report.' : '',
      },
    });
    const { data: newPatient, error: insertError } = await insertTriageAssessment(
      access.supabase,
      assessment
    );
    if (insertError) {
      console.error('Unable to persist synthetic triage assessment:', {
        code: insertError.code || null,
        status: insertError.status || null,
        message: insertError.message || 'No error message was provided.',
      });
      return NextResponse.json({ error: 'Unable to save the synthetic assessment.' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: 'Simulated triage patient intake generated.',
      data: newPatient
    }, { status: 201 });

  } catch (err) {
    console.error('Error simulating patient triage:', err?.message || err);
    return NextResponse.json({ error: 'Unable to create the synthetic assessment.' }, { status: 500 });
  }
}
