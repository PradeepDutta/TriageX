const TRIAGE_PRESENTATION = {
  RED: { number: 1, label: 'RED', name: 'Level 1 — RED', urgency: 'EMERGENCY', className: 'red', color: '#e8203a', targetTime: 'IMMEDIATE (< 5 mins)' },
  ORANGE: { number: 2, label: 'ORANGE', name: 'Level 2 — ORANGE', urgency: 'URGENT', className: 'orange', color: '#f97316', targetTime: 'Urgent (< 15-30 mins)' },
  YELLOW: { number: 2, label: 'ORANGE', name: 'Level 2 — ORANGE', urgency: 'URGENT', className: 'orange', color: '#f97316', targetTime: 'Urgent (< 15-30 mins)' },
  // Level 3 Yellow
  SEMI_URGENT: { number: 3, label: 'YELLOW', name: 'Level 3 — YELLOW', urgency: 'SEMI-URGENT', className: 'yellow', color: '#eab308', targetTime: 'Semi-Urgent (< 60 mins)' },
  GREEN: { number: 3, label: 'YELLOW', name: 'Level 3 — YELLOW', urgency: 'SEMI-URGENT', className: 'yellow', color: '#eab308', targetTime: 'Semi-Urgent (< 60 mins)' },
  // Level 4 Routine Green
  ROUTINE: { number: 4, label: 'GREEN', name: 'Level 4 — GREEN', urgency: 'ROUTINE', className: 'green', color: '#10b981', targetTime: 'Standard OPD Queue (< 120 mins)' },
  BLUE: { number: 4, label: 'GREEN', name: 'Level 4 — GREEN', urgency: 'ROUTINE', className: 'green', color: '#10b981', targetTime: 'Standard OPD Queue (< 120 mins)' },
};

export function getTriageDisplay(level) {
  const normalized = level?.toUpperCase()?.replace(/[\s-]/g, '_');
  return TRIAGE_PRESENTATION[normalized] || {
    number: 4,
    label: 'UNASSIGNED',
    name: 'Unassigned',
    urgency: 'NON-URGENT',
    className: 'green',
    color: '#10b981',
    targetTime: 'Standard OPD Queue (< 120 mins)',
  };
}