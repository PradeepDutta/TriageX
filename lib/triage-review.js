export function createTriageReviewPayload(body, actorUserId) {
  return {
    triageLevel: body.triageLevel
      ? String(body.triageLevel).toUpperCase().trim()
      : undefined,
    doctorNotes: typeof body.doctorNotes === 'string'
      ? body.doctorNotes.trim().slice(0, 2000)
      : '',
    reviewedBy: actorUserId,
    suggestedDepartment: typeof body.suggestedDepartment === 'string'
      ? body.suggestedDepartment.trim().slice(0, 100)
      : undefined,
    status: 'DOCTOR_REVIEWED',
  };
}

export function applyTriageReview(patient, reviewData) {
  const updatedPatient = { ...patient };
  const {
    triageLevel,
    doctorNotes = '',
    reviewedBy = 'Dr. Staff Medical Officer',
    suggestedDepartment,
    status = 'DOCTOR_REVIEWED',
  } = reviewData;

  const wasOverridden = Boolean(triageLevel && triageLevel !== updatedPatient.triageLevel);

  if (triageLevel) {
    updatedPatient.triageLevel = triageLevel;
    if (triageLevel === 'RED') {
      updatedPatient.priorityScore = Math.max(88, updatedPatient.priorityScore);
      updatedPatient.colorTheme = '#e8203a';
      updatedPatient.triageLabel = 'Level 1 — RED (Confirmed by Doctor)';
      updatedPatient.targetResponseTime = 'IMMEDIATE (< 5 mins)';
    } else if (triageLevel === 'YELLOW' || triageLevel === 'ORANGE') {
      updatedPatient.priorityScore = Math.max(65, updatedPatient.priorityScore);
      updatedPatient.colorTheme = '#f97316';
      updatedPatient.triageLabel = 'Level 2 — ORANGE (Confirmed by Doctor)';
      updatedPatient.targetResponseTime = 'Urgent (< 15-30 mins)';
    } else if (triageLevel === 'GREEN') {
      updatedPatient.priorityScore = Math.min(45, updatedPatient.priorityScore);
      updatedPatient.colorTheme = '#eab308';
      updatedPatient.triageLabel = 'Level 3 — YELLOW (Confirmed by Doctor)';
      updatedPatient.targetResponseTime = 'Semi-Urgent (< 60 mins)';
    } else if (triageLevel === 'BLUE') {
      updatedPatient.priorityScore = Math.min(20, updatedPatient.priorityScore);
      updatedPatient.colorTheme = '#10b981';
      updatedPatient.triageLabel = 'Level 4 — GREEN (Confirmed by Doctor)';
      updatedPatient.targetResponseTime = 'Standard OPD Queue (< 120 mins)';
    }
  }

  if (suggestedDepartment) {
    updatedPatient.suggestedDepartment = suggestedDepartment;
  }

  updatedPatient.status = status;
  updatedPatient.doctorNotes = doctorNotes;
  updatedPatient.reviewedBy = reviewedBy;
  updatedPatient.wasOverridden = wasOverridden;
  updatedPatient.reviewedAt = new Date().toISOString();
  return updatedPatient;
}
