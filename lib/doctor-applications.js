const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CREDENTIAL_BYTES = 5 * 1024 * 1024;
const CREDENTIAL_TYPES = Object.freeze({
  'application/pdf': { extension: 'pdf', signature: (bytes) => bytes.subarray(0, 5).toString('ascii') === '%PDF-' },
  'image/jpeg': { extension: 'jpg', signature: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  'image/png': {
    extension: 'png',
    signature: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
});

function isText(value, minimum, maximum) {
  return typeof value === 'string' && value.trim().length >= minimum && value.trim().length <= maximum;
}

export function validateDoctorApplicationInput(input) {
  const phone = typeof input?.phone === 'string' ? input.phone.trim() : '';
  if (!isText(input?.fullName, 2, 100)) return { valid: false, error: 'Enter your full name.' };
  const phoneDigits = phone.replace(/\D/g, '').length;
  if (!/^\+?[0-9\s().-]{7,24}$/.test(phone) || phoneDigits < 7 || phoneDigits > 15) {
    return { valid: false, error: 'Enter a valid phone number.' };
  }
  if (!isText(input?.qualification, 2, 120)) return { valid: false, error: 'Enter your medical qualification.' };
  if (!isText(input?.registrationNumber, 3, 80)) return { valid: false, error: 'Enter your medical registration number.' };
  if (!isText(input?.specialization, 2, 100)) return { valid: false, error: 'Enter your specialization.' };
  if (!isText(input?.affiliation, 2, 200)) return { valid: false, error: 'Enter your hospital or clinic affiliation.' };
  if (!UUID_PATTERN.test(input?.hospitalId || '') || !UUID_PATTERN.test(input?.departmentId || '')) {
    return { valid: false, error: 'Select an active hospital and department.' };
  }
  return { valid: true };
}

export function validateDoctorCredentialFile({ name, type, size, bytes }) {
  const mimeType = CREDENTIAL_TYPES[type];
  if (!mimeType || typeof name !== 'string' || name.length > 255) {
    return { valid: false, error: 'Upload a PDF, JPEG, or PNG credential document.' };
  }
  if (!Number.isInteger(size) || size < 1 || size > MAX_CREDENTIAL_BYTES) {
    return { valid: false, error: 'Credential documents must be no larger than 5 MB.' };
  }

  const buffer = Buffer.from(bytes || []);
  if (buffer.length !== size || !mimeType.signature(buffer)) {
    return { valid: false, error: 'The credential document content does not match its file type.' };
  }
  return { valid: true, extension: mimeType.extension, mimeType };
}

export function mapDoctorApplicationForReview(application) {
  return {
    userId: application.user_id,
    fullName: application.full_name,
    email: application.email,
    phone: application.phone,
    qualification: application.qualification,
    registrationNumber: application.registration_number,
    specialization: application.specialization,
    affiliation: application.affiliation,
    requestedHospitalId: application.requested_hospital_id,
    requestedDepartmentId: application.requested_department_id,
    requestedHospital: application.requested_hospital?.name || 'Hospital unavailable',
    requestedDepartment: application.requested_department?.name || 'Department unavailable',
    assignedDepartmentId: application.assigned_department_id,
    status: application.status,
    decisionNote: application.decision_note,
    reviewerUserId: application.reviewer_user_id,
    reviewedAt: application.reviewed_at,
    submittedAt: application.submitted_at,
    hasCredentialDocument: Boolean(application.credential_document_path),
  };
}
