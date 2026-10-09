import { NextResponse } from 'next/server';
import { addPatientIntake, getPatientQueue } from '@/lib/triage-store';
import { createSimulationProfile, isSimulatedPatient } from '@/lib/triage-simulation';

export async function POST() {
  try {
    const patients = getPatientQueue();
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

    const newPatient = addPatientIntake({
      ...profile,
      isSimulated: true,
      vitals: simulatedVitals,
      imageInput: Math.random() > 0.5 ? { fileName: 'simulated_trauma_photo.jpg', description: 'Cutaneous trauma / laceration photo' } : null,
      reportText: Math.random() > 0.6 ? 'Lab Test: WBC = 16,500 /uL (Elevated Infection Markers).' : ''
    });

    return NextResponse.json({
      success: true,
      message: 'Simulated triage patient intake generated.',
      data: newPatient
    }, { status: 201 });

  } catch (err) {
    console.error('Error simulating patient triage:', err);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
