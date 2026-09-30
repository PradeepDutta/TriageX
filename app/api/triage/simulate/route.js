import { NextResponse } from 'next/server';
import { addPatientIntake } from '@/lib/triage-store';

const SAMPLE_NAMES = [
  { name: 'Kavita Sundaram', age: 48, gender: 'Female', lang: 'ta', text: 'கடுமையான ஆஸ்துமா மூச்சுத் திணறல் (Severe asthmatic dyspnea, unable to complete sentence)' },
  { name: 'Vijay Shekhawat', age: 29, gender: 'Male', lang: 'hi', text: 'बाइक से गिर गए, घुटने और सिर में कट गया है। (Bike accident, deep laceration on scalp and knee)' },
  { name: 'Priya Mukherjee', age: 34, gender: 'Female', lang: 'bn', text: 'প্রবল জ্বর এবং পেটে প্রচণ্ড ব্যথা। (Severe fever 102F and right lower quadrant abdominal pain)' },
  { name: 'Srinivas Rao', age: 58, gender: 'Male', lang: 'te', text: 'అధిక రక్తపోటు మరియు కళ్ళు తిరగడం. (Hypertension emergency, extreme giddiness)' },
  { name: 'Deepak Thorat', age: 40, gender: 'Male', lang: 'mr', text: 'हाताला गरम तेलाचा भाजला आहे. (Second degree scald burn on left hand)' },
];

const FACILITIES = [
  'PHC Rampur',
  'Camp Baramati - Rural Health Unit',
  'Jamshedpur Industrial Health Center',
  'District Hospital Pune',
  'IIT Campus Health Center'
];

export async function POST() {
  try {
    const randomSample = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
    const randomFacility = FACILITIES[Math.floor(Math.random() * FACILITIES.length)];

    const simulatedVitals = {
      pulse: Math.floor(70 + Math.random() * 60),
      systolicBP: Math.floor(105 + Math.random() * 70),
      diastolicBP: Math.floor(65 + Math.random() * 45),
      spo2: Math.floor(86 + Math.random() * 13),
      temperature: Number((98.2 + Math.random() * 5).toFixed(1)),
      respirationRate: Math.floor(14 + Math.random() * 14)
    };

    const newPatient = addPatientIntake({
      patientName: randomSample.name,
      age: randomSample.age,
      gender: randomSample.gender,
      facilityName: randomFacility,
      facilityType: randomFacility.includes('PHC') ? 'Primary Health Center (PHC)' : (randomFacility.includes('Camp') ? 'Public Health Camp' : 'District Hospital'),
      language: randomSample.lang,
      symptomText: randomSample.text,
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
