import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapDoctorApplicationForReview,
  validateDoctorApplicationInput,
  validateDoctorCredentialFile,
} from '../lib/doctor-applications.js';

const validApplication = {
  fullName: 'Dr Synthetic Example',
  phone: '+1 (555) 010-2000',
  qualification: 'MBBS',
  registrationNumber: 'REG-12345',
  specialization: 'Family Medicine',
  affiliation: 'Example Community Clinic',
  hospitalId: '92000000-0000-4000-8000-000000000201',
  departmentId: '92000000-0000-4000-8000-000000000301',
};

test('doctor application validates required details and explicit hospital scope', () => {
  assert.deepEqual(validateDoctorApplicationInput(validApplication), { valid: true });
  assert.equal(validateDoctorApplicationInput({ ...validApplication, registrationNumber: '  ' }).valid, false);
  assert.equal(validateDoctorApplicationInput({ ...validApplication, phone: 'call me' }).valid, false);
  assert.equal(validateDoctorApplicationInput({ ...validApplication, departmentId: 'untrusted' }).valid, false);
});

test('credential validation accepts matching PDF, JPEG, and PNG signatures', () => {
  assert.equal(validateDoctorCredentialFile({
    name: 'qualification.pdf',
    type: 'application/pdf',
    size: 8,
    bytes: Buffer.from('%PDF-1.7'),
  }).valid, true);
  assert.equal(validateDoctorCredentialFile({
    name: 'card.jpg',
    type: 'image/jpeg',
    size: 3,
    bytes: Buffer.from([0xff, 0xd8, 0xff]),
  }).valid, true);
  assert.equal(validateDoctorCredentialFile({
    name: 'card.png',
    type: 'image/png',
    size: 8,
    bytes: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  }).valid, true);
});

test('credential validation rejects extension spoofing, mismatched MIME, and oversized files', () => {
  assert.equal(validateDoctorCredentialFile({
    name: 'credential.pdf',
    type: 'application/pdf',
    size: 4,
    bytes: Buffer.from('<svg'),
  }).valid, false);
  assert.equal(validateDoctorCredentialFile({
    name: 'credential.png',
    type: 'image/png',
    size: 3,
    bytes: Buffer.from([0xff, 0xd8, 0xff]),
  }).valid, false);
  assert.equal(validateDoctorCredentialFile({
    name: 'credential.pdf',
    type: 'application/pdf',
    size: 5 * 1024 * 1024 + 1,
    bytes: Buffer.alloc(0),
  }).valid, false);
});

test('review mapping omits private storage paths', () => {
  const mapped = mapDoctorApplicationForReview({
    user_id: 'applicant-id',
    full_name: 'Dr Synthetic Example',
    email: 'doctor@example.invalid',
    phone: '+15550102000',
    qualification: 'MBBS',
    registration_number: 'REG-12345',
    specialization: 'Family Medicine',
    affiliation: 'Example Community Clinic',
    requested_hospital_id: validApplication.hospitalId,
    requested_department_id: validApplication.departmentId,
    credential_document_path: 'private-storage/path.pdf',
    status: 'pending',
    submitted_at: '2026-11-10T00:00:00.000Z',
  });
  assert.equal(mapped.hasCredentialDocument, true);
  assert.equal('credential_document_path' in mapped, false);
  assert.equal('credentialDocumentPath' in mapped, false);
});
