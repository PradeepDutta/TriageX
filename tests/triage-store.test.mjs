import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPatientQueue,
  getPatientById,
  reviewPatientTriage,
  getFacilityStats,
  addPatientIntake
} from '../lib/triage-store.js';

test('Triage Store: TRG-1861 exists in store and is labeled as simulated demo data', () => {
  const trg1861 = getPatientById('TRG-1861');
  assert.ok(trg1861, 'TRG-1861 must exist in the triage store');
  assert.equal(trg1861.patientName, 'Devika Sharma');
  assert.equal(trg1861.triageLevel, 'RED');
  assert.equal(trg1861.numericalScore, 35);
  assert.equal(trg1861.isEmergencyOverride, true);
  assert.equal(trg1861.isSimulated, true, 'Synthetic records must be labeled isSimulated');
});

test('Triage Store: Queue prioritization places Level 1 RED emergency cases first', () => {
  const queue = getPatientQueue();
  assert.ok(queue.length > 0, 'Queue must contain patients');

  // Verify that any RED patient is sorted in the top tier of the queue
  const firstPatient = queue[0];
  assert.equal(firstPatient.triageLevel, 'RED', 'The highest priority patient in queue must be Level 1 RED');

  // Verify TRG-1861 is sorted within the RED emergency group, ahead of lower-tier patients
  const trg1861Index = queue.findIndex(p => p.id === 'TRG-1861');
  assert.ok(trg1861Index !== -1, 'TRG-1861 should be in the queue');

  const blueIndex = queue.findIndex(p => p.triageLevel === 'BLUE');
  if (blueIndex !== -1) {
    assert.ok(trg1861Index < blueIndex, 'Emergency RED TRG-1861 must be queued before routine BLUE patients');
  }
});

test('Triage Store: Clinician review updates status, audit override, and notes', () => {
  const queue = getPatientQueue();
  const testPatient = queue.find(p => p.status === 'PENDING_DOCTOR_APPROVAL');
  assert.ok(testPatient, 'Must have a pending patient to test review');

  const originalLevel = testPatient.triageLevel;
  const newLevel = originalLevel === 'RED' ? 'YELLOW' : 'RED';

  const updated = reviewPatientTriage(testPatient.id, {
    triageLevel: newLevel,
    doctorNotes: 'Reviewed vitals and ECG; adjusted triage tier according to local ED capacity.',
    reviewedBy: 'Dr. A. Verma (Emergency Resident)',
    suggestedDepartment: 'Emergency Acute Bay'
  });

  assert.equal(updated.status, 'DOCTOR_REVIEWED');
  assert.equal(updated.triageLevel, newLevel);
  assert.equal(updated.wasOverridden, true);
  assert.equal(updated.reviewedBy, 'Dr. A. Verma (Emergency Resident)');
  assert.ok(updated.reviewedAt);
});

test('Triage Store: Facility stats calculation returns dynamic numbers', () => {
  const stats = getFacilityStats();

  assert.ok(typeof stats.totalPatients === 'number');
  assert.ok(typeof stats.redCount === 'number');
  assert.ok(typeof stats.clinicalAlignmentPct === 'string');
  assert.ok(stats.clinicalAlignmentPct.includes('%'));
  assert.ok(typeof stats.avgResponseTime === 'string');
  assert.ok(stats.avgResponseTime.includes('min'));
  assert.ok(Array.isArray(stats.facilityWorkload));
  assert.ok(stats.facilityWorkload.length > 0);
});
