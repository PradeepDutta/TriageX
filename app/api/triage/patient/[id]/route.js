import { NextResponse } from 'next/server';
import { getPatientById } from '@/lib/triage-store';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const patient = getPatientById(id);

    if (!patient) {
      return NextResponse.json({ error: 'Patient triage record not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: patient
    });
  } catch (err) {
    console.error('Error fetching patient triage record:', err);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
