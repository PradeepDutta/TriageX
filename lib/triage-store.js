/**
 * In-Memory Healthcare Triage Patient Store
 * Handles dynamic patient intake, doctor override actions, queue prioritization, and facility stats.
 */

import { processTriage } from './triage-engine.js';

// Pre-seeded initial triage records for live demo
const initialPatients = [
  {
    id: 'TRG-9021',
    patientName: 'Ramesh Verma',
    age: 54,
    gender: 'Male',
    contact: '+91 98765 43210',
    facilityType: 'Primary Health Center (PHC)',
    facilityName: 'PHC Rampur',
    language: 'hi',
    symptomText: 'सीने में बहुत तेज दर्द हो रहा है और सांस लेने में भारी तकलीफ है। पसीना आ रहा है। (Severe crushing chest pain radiating to left arm with shortness of breath)',
    vitals: {
      pulse: 124,
      systolicBP: 178,
      diastolicBP: 106,
      spo2: 88,
      temperature: 98.6,
      respirationRate: 26
    },
    imageInput: {
      fileName: 'patient_ecg_lead.jpg',
      tag: 'ecg_ischemia',
      description: 'Acute ST Segment Elevation observed on telemetry'
    },
    reportText: 'ECG Impression: Acute Anterior Wall Myocardial Infarction. ST Elevation in V2-V4. Troponin-I: Positive (3.4 ng/mL).',
    status: 'PENDING_DOCTOR_APPROVAL',
    doctorNotes: '',
    reviewedBy: '',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'TRG-9022',
    patientName: 'Sunita Devi',
    age: 42,
    gender: 'Female',
    contact: '+91 94123 88765',
    facilityType: 'Public Health Camp',
    facilityName: 'Camp Baramati - Rural Health Unit',
    language: 'mr',
    symptomText: 'खूप तीव्र ताप, डोकेदुखी आणि अंगावर लाल चट्टे. उल्टी होत आहे. (High persistent fever for 4 days, severe headache, petechial rash, vomiting)',
    vitals: {
      pulse: 112,
      systolicBP: 100,
      diastolicBP: 64,
      spo2: 94,
      temperature: 103.4,
      respirationRate: 22
    },
    imageInput: {
      fileName: 'petechial_rash.png',
      tag: 'rash',
      description: 'Multiple petechial skin rashes on forearm and trunk'
    },
    reportText: 'Lab CBC Report (Baramati Lab): Platelets = 24,000 /uL (CRITICAL LOW). Hemoglobin = 11.2 g/dL. Hematocrit = 48% (Hemo-concentration). Dengue NS1: POSITIVE.',
    status: 'PENDING_DOCTOR_APPROVAL',
    doctorNotes: '',
    reviewedBy: '',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'TRG-9023',
    patientName: 'Rajesh Patil',
    age: 36,
    gender: 'Male',
    contact: '+91 91234 56789',
    facilityType: 'Industrial Clinic',
    facilityName: 'Jamshedpur Industrial Health Center',
    language: 'en',
    symptomText: 'Fell from ladder at factory floor. Right forearm severe deformity, sharp localized bone pain, swelling.',
    vitals: {
      pulse: 98,
      systolicBP: 135,
      diastolicBP: 85,
      spo2: 98,
      temperature: 98.4,
      respirationRate: 18
    },
    imageInput: {
      fileName: 'forearm_trauma.jpg',
      tag: 'open wound',
      description: 'Deformity in mid-forearm with focal skin swelling'
    },
    reportText: 'Portable X-ray: Complete transverse fracture of mid-shaft radius and ulna with angulation.',
    status: 'PENDING_DOCTOR_APPROVAL',
    doctorNotes: '',
    reviewedBy: '',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: 'TRG-9024',
    patientName: 'Ananya Sharma',
    age: 24,
    gender: 'Female',
    contact: '+91 98989 12345',
    facilityType: 'Campus Health Center',
    facilityName: 'IIT Campus Health Center',
    language: 'en',
    symptomText: 'Throbbing right-sided headache since morning, sensitivity to light, mild nausea. No fever or neck stiffness.',
    vitals: {
      pulse: 76,
      systolicBP: 118,
      diastolicBP: 74,
      spo2: 99,
      temperature: 98.2,
      respirationRate: 15
    },
    imageInput: null,
    reportText: '',
    status: 'DOCTOR_REVIEWED',
    doctorNotes: 'Confirmed Level 3 Semi-Urgent (Acute Migraine). Prescribed oral NSAID & antiemetic. Rest in quiet room.',
    reviewedBy: 'Dr. K. Swaminathan (MO)',
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
  },
  {
    id: 'TRG-9025',
    patientName: 'Mohammed Arif',
    age: 61,
    gender: 'Male',
    contact: '+91 97654 32109',
    facilityType: 'Government Hospital',
    facilityName: 'District Hospital Pune',
    language: 'hi',
    symptomText: 'ब्लड प्रेशर की दवा खत्म हो गई है, रूटीन चेकअप और नया पर्चा बनवाना है। (BP routine medicine refill request)',
    vitals: {
      pulse: 72,
      systolicBP: 128,
      diastolicBP: 82,
      spo2: 98,
      temperature: 98.0,
      respirationRate: 16
    },
    imageInput: null,
    reportText: 'Previous Discharge Summary: Essential Hypertension on Amlodipine 5mg OD.',
    status: 'DOCTOR_REVIEWED',
    doctorNotes: 'Reviewed. BP well controlled. Prescribed 30-day refill of Amlodipine 5mg.',
    reviewedBy: 'Dr. P. Deshmukh',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  }
];

// In-Memory store container
let globalPatients = initialPatients.map(patient => {
  const triageResult = processTriage(patient);
  return { ...patient, ...triageResult };
});

/**
 * Gets all patients sorted by priority score (descending) & wait time
 */
export function getPatientQueue(filters = {}) {
  let list = [...globalPatients];

  if (filters.facilityType && filters.facilityType !== 'ALL') {
    list = list.filter(p => p.facilityType === filters.facilityType);
  }

  if (filters.triageLevel && filters.triageLevel !== 'ALL') {
    list = list.filter(p => p.triageLevel === filters.triageLevel);
  }

  if (filters.status && filters.status !== 'ALL') {
    list = list.filter(p => p.status === filters.status);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(p =>
      p.patientName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.symptomText.toLowerCase().includes(q) ||
      p.facilityName.toLowerCase().includes(q)
    );
  }

  // Sort by Priority Score descending (highest score / RED patients first), then by age/wait time
  list.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return list;
}

/**
 * Gets patient detail by ID
 */
export function getPatientById(id) {
  return globalPatients.find(p => p.id === id) || null;
}

/**
 * Adds new patient intake record
 */
export function addPatientIntake(intakeData) {
  const newId = `TRG-${Math.floor(1000 + Math.random() * 9000)}`;
  const triageResult = processTriage(intakeData);

  const newPatient = {
    id: newId,
    ...intakeData,
    ...triageResult,
    status: 'PENDING_DOCTOR_APPROVAL',
    doctorNotes: '',
    reviewedBy: '',
    createdAt: new Date().toISOString()
  };

  globalPatients.unshift(newPatient);
  return newPatient;
}

/**
 * Human-In-The-Loop: Doctor reviews AI triage, confirms or overrides
 */
export function reviewPatientTriage(id, reviewData) {
  const patient = getPatientById(id);
  if (!patient) return null;

  const {
    triageLevel,
    doctorNotes = '',
    reviewedBy = 'Dr. Staff Medical Officer',
    suggestedDepartment,
    status = 'DOCTOR_REVIEWED'
  } = reviewData;

  // Record human override audit
  const wasOverridden = triageLevel && triageLevel !== patient.triageLevel;
  
  if (triageLevel) {
    patient.triageLevel = triageLevel;
    if (triageLevel === 'RED') {
      patient.priorityScore = Math.max(88, patient.priorityScore);
      patient.colorTheme = '#ef4444';
      patient.triageLabel = 'Level 1 - EMERGENCY (Overridden by Doctor)';
      patient.targetResponseTime = 'IMMEDIATE (< 5 mins)';
    } else if (triageLevel === 'YELLOW') {
      patient.priorityScore = 70;
      patient.colorTheme = '#f59e0b';
      patient.triageLabel = 'Level 2 - Urgent (Overridden by Doctor)';
      patient.targetResponseTime = 'Urgent (< 15-30 mins)';
    } else if (triageLevel === 'GREEN') {
      patient.priorityScore = 40;
      patient.colorTheme = '#10b981';
      patient.triageLabel = 'Level 3 - Semi-Urgent (Overridden by Doctor)';
      patient.targetResponseTime = 'Semi-Urgent (< 60 mins)';
    } else if (triageLevel === 'BLUE') {
      patient.priorityScore = 15;
      patient.colorTheme = '#3b82f6';
      patient.triageLabel = 'Level 4 - Non-Urgent (Overridden by Doctor)';
      patient.targetResponseTime = 'Standard OPD Queue (< 120 mins)';
    }
  }

  if (suggestedDepartment) {
    patient.suggestedDepartment = suggestedDepartment;
  }

  patient.status = status;
  patient.doctorNotes = doctorNotes;
  patient.reviewedBy = reviewedBy;
  patient.wasOverridden = wasOverridden;
  patient.reviewedAt = new Date().toISOString();

  return patient;
}

/**
 * Generates dynamic facility stats
 */
export function getFacilityStats() {
  const totalPatients = globalPatients.length;
  const redCount = globalPatients.filter(p => p.triageLevel === 'RED').length;
  const pendingRedCount = globalPatients.filter(p => p.triageLevel === 'RED' && p.status === 'PENDING_DOCTOR_APPROVAL').length;
  const yellowCount = globalPatients.filter(p => p.triageLevel === 'YELLOW').length;
  const greenCount = globalPatients.filter(p => p.triageLevel === 'GREEN').length;
  const blueCount = globalPatients.filter(p => p.triageLevel === 'BLUE').length;
  const pendingCount = globalPatients.filter(p => p.status === 'PENDING_DOCTOR_APPROVAL').length;
  const reviewedCount = globalPatients.filter(p => p.status === 'DOCTOR_REVIEWED').length;

  const avgPriority = Math.round(
    globalPatients.reduce((acc, p) => acc + p.priorityScore, 0) / (totalPatients || 1)
  );

  return {
    totalPatients,
    redCount,
    pendingRedCount,
    yellowCount,
    greenCount,
    blueCount,
    pendingCount,
    reviewedCount,
    avgPriority,
    activeFacilities: ['PHC Rampur', 'Camp Baramati', 'Industrial Clinic Jamshedpur', 'District Hospital Pune', 'IIT Campus Clinic'],
    timestamp: new Date().toISOString()
  };
}
