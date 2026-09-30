import { NextResponse } from 'next/server';
import { addPatientIntake } from '@/lib/triage-store';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.symptomText && !body.vitals && !body.imageInput && !body.reportText) {
      return NextResponse.json(
        { error: 'At least one multimodal input (symptom description, vitals, image, or lab report) is required.' },
        { status: 400 }
      );
    }

    const patientRecord = addPatientIntake(body);

    return NextResponse.json({
      success: true,
      message: 'Patient triage intake successfully processed.',
      data: patientRecord
    }, { status: 201 });

  } catch (err) {
    console.error('Error in Triage Intake API:', err);
    return NextResponse.json({ error: 'Internal Server Error processing triage intake.' }, { status: 500 });
  }
}
