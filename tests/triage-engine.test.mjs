import test from 'node:test';
import assert from 'node:assert/strict';
import { processTriage } from '../lib/triage-engine.js';

test('Triage Engine: TRG-1861 resolution — emergency override separated from numerical score', () => {
  const patientInput = {
    patientName: 'Devika Sharma',
    age: 49,
    gender: 'Female',
    symptomText: 'Severe squeezing chest pain radiating to left arm for 45 mins with cold sweating.',
    vitals: {
      pulse: 100,
      systolicBP: 125,
      diastolicBP: 66,
      spo2: 95,
      temperature: 98.4,
      respirationRate: 18
    }
  };

  const result = processTriage(patientInput);

  // Core assertions for TRG-1861
  assert.equal(result.triageLevel, 'RED', 'Triage level must be RED for acute chest pain red flag');
  assert.equal(result.numericalScore, 35, 'Raw physiological+symptom numerical score must be 35');
  assert.equal(result.priorityScore, 35, 'Priority score must faithfully reflect the 35/100 score');
  assert.equal(result.isEmergencyOverride, true, 'Emergency override flag must be true');
  assert.ok(result.emergencyOverrideReason.includes('chest pain'), 'Override reason must cite chest pain red flag');
  assert.equal(result.colorTheme, '#e8203a', 'Canonical Level 1 Red hex color');
  assert.ok(result.aiConfidence.includes('%'), 'Confidence must be percentage string');
  const confNum = parseInt(result.aiConfidence, 10);
  assert.ok(confNum >= 70 && confNum <= 100, 'Confidence number must be bounded between 70 and 100%');
  assert.ok(result.structuredNote.assessment.includes('ACUTE CORONARY') || result.structuredNote.assessment.includes('EMERGENCY'));
});

test('Triage Engine: Missing vitals flagging in structured note', () => {
  const patientIncomplete = {
    patientName: 'Ramesh Patel',
    age: 55,
    gender: 'Male',
    symptomText: 'Fever and chills since yesterday',
    vitals: {
      // Pulse, BP, SpO2 omitted
      temperature: 102.5
    }
  };

  const result = processTriage(patientIncomplete);

  assert.ok(result.structuredNote.missingVitals, 'Structured note must contain missingVitals array');
  assert.ok(result.structuredNote.missingVitals.some(v => /pulse|heart/i.test(v)), 'Must flag missing pulse');
  assert.ok(result.structuredNote.missingVitals.some(v => /blood pressure|bp/i.test(v)), 'Must flag missing BP');
  assert.ok(result.structuredNote.missingVitals.some(v => /spo2|oxygen/i.test(v)), 'Must flag missing SpO2');
  assert.ok(result.structuredNote.missingVitals.some(v => /respiration/i.test(v)), 'Must flag missing respiration rate');
  assert.ok(result.structuredNote.assessment.includes('Incomplete vitals flagged'));
});

test('Triage Engine: Boundary and invalid vitals handling', () => {
  const patientInvalidVitals = {
    patientName: 'Test Patient',
    age: 30,
    gender: 'Other',
    symptomText: 'Mild rash on left arm',
    vitals: {
      pulse: 'invalid-string',
      systolicBP: -50,
      diastolicBP: 999,
      spo2: 'not-a-number',
      temperature: null,
      respirationRate: undefined
    }
  };

  const result = processTriage(patientInvalidVitals);

  // Must not throw or produce NaN
  assert.ok(!isNaN(result.priorityScore), 'Priority score must be a valid number');
  assert.ok(!isNaN(result.numericalScore), 'Numerical score must be a valid number');
  assert.ok(typeof result.aiConfidence === 'string' && result.aiConfidence.includes('%'), 'Confidence must be valid percentage');
  assert.ok(result.numericalScore >= 0, 'Score should safely default without crashing');
});

test('Triage Engine: Routine complaint classification (BLUE / Level 4)', () => {
  const patientRoutine = {
    patientName: 'Mohammed Arif',
    age: 61,
    gender: 'Male',
    symptomText: 'Routine BP medication refill and periodic checkup. No acute pain or distress.',
    vitals: {
      pulse: 72,
      systolicBP: 128,
      diastolicBP: 82,
      spo2: 98,
      temperature: 98.0,
      respirationRate: 14
    }
  };

  const result = processTriage(patientRoutine);

  assert.equal(result.triageLevel, 'BLUE');
  assert.equal(result.isEmergencyOverride, false);
  assert.equal(result.colorTheme, '#10b981');
  assert.ok(result.priorityScore <= 30);
});
