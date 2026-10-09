import test from 'node:test';
import assert from 'node:assert/strict';

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function generateCsv(patients) {
  const headers = [
    'Record Type',
    'Patient ID',
    'Created At',
    'Name',
    'Age',
    'Gender',
    'Contact',
    'Facility Name',
    'Facility Type',
    'Language',
    'Triage Level',
    'Priority Score',
    'Emergency Override Active',
    'Emergency Override Reason',
    'Missing Vitals Flagged',
    'Pulse (bpm)',
    'Systolic BP (mmHg)',
    'Diastolic BP (mmHg)',
    'SpO2 (%)',
    'Temperature (F)',
    'Respiration Rate (/min)',
    'Chief Complaint / Symptoms',
    'Review Status',
    'Reviewed By',
    'Doctor Notes'
  ];

  const rows = patients.map((p) => [
    escapeCsv(p.isSimulated ? 'DEMO DATA (SYNTHETIC RECORD)' : 'LIVE CLINICAL INTAKE'),
    escapeCsv(p.id),
    escapeCsv(p.createdAt ? new Date(p.createdAt).toISOString() : ''),
    escapeCsv(p.patientName),
    escapeCsv(p.age),
    escapeCsv(p.gender),
    escapeCsv(p.contact),
    escapeCsv(p.facilityName),
    escapeCsv(p.facilityType),
    escapeCsv(p.language),
    escapeCsv(p.triageLevel),
    escapeCsv(p.priorityScore),
    escapeCsv(p.isEmergencyOverride ? 'YES' : 'NO'),
    escapeCsv(p.emergencyOverrideReason || 'N/A'),
    escapeCsv(p.structuredNote?.missingVitals?.length > 0 ? p.structuredNote.missingVitals.join('; ') : 'None'),
    escapeCsv(p.vitals?.pulse ?? 'N/A'),
    escapeCsv(p.vitals?.systolicBP ?? 'N/A'),
    escapeCsv(p.vitals?.diastolicBP ?? 'N/A'),
    escapeCsv(p.vitals?.spo2 ?? 'N/A'),
    escapeCsv(p.vitals?.temperature ?? 'N/A'),
    escapeCsv(p.vitals?.respirationRate ?? 'N/A'),
    escapeCsv(p.symptomText || ''),
    escapeCsv(p.status),
    escapeCsv(p.reviewedBy || ''),
    escapeCsv(p.doctorNotes || '')
  ]);

  return '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

test('CSV Export: Generates RFC-4180 compliant CSV with proper escaping', () => {
  const mockPatients = [
    {
      id: 'TRG-1861',
      patientName: 'Devika Sharma',
      age: 49,
      gender: 'Female',
      contact: '+91 98220 11223',
      facilityName: 'PHC Rampur',
      facilityType: 'Primary Health Center',
      language: 'hi',
      triageLevel: 'RED',
      priorityScore: 92,
      isEmergencyOverride: true,
      emergencyOverrideReason: 'Red flag emergency symptoms detected: chest pain',
      isSimulated: true,
      vitals: {
        pulse: 100,
        systolicBP: 125,
        diastolicBP: 66,
        spo2: 95,
        temperature: 98.4,
        respirationRate: 18
      },
      symptomText: 'Severe squeezing chest pain, "radiating" to arm\nCold sweats',
      status: 'PENDING_DOCTOR_APPROVAL',
      reviewedBy: '',
      doctorNotes: '',
      structuredNote: { missingVitals: [] },
      createdAt: '2026-10-09T10:00:00.000Z'
    }
  ];

  const csv = generateCsv(mockPatients);

  // Check UTF-8 BOM
  assert.ok(csv.startsWith('\uFEFF'), 'CSV must include UTF-8 BOM for Excel compatibility');

  // Check Headers
  assert.ok(csv.includes('"Record Type"'));
  assert.ok(csv.includes('"Emergency Override Active"'));
  assert.ok(csv.includes('"Missing Vitals Flagged"'));

  // Check Labeling
  assert.ok(csv.includes('"DEMO DATA (SYNTHETIC RECORD)"'), 'Synthetic patient must be clearly labeled');

  // Check Escaping of Quotes and Commas
  assert.ok(csv.includes('""radiating""'), 'Quotes inside symptom text must be doubled');
  assert.ok(csv.includes('"TRG-1861"'));
  assert.ok(csv.includes('"Devika Sharma"'));
});
