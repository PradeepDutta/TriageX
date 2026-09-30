import { NextResponse } from 'next/server';
import { reviewPatientTriage } from '@/lib/triage-store';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedPatient = reviewPatientTriage(id, body);

    if (!updatedPatient) {
      return NextResponse.json({ error: 'Patient record not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Human-in-the-loop clinical review recorded successfully.',
      data: updatedPatient
    });
  } catch (err) {
    console.error('Error recording doctor triage review:', err);
    return NextResponse.json({ error: 'Internal Server Error recording triage review.' }, { status: 500 });
  }
}
