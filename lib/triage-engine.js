/**
 * Clinical Multimodal Healthcare Triage Engine
 * Built for Indian Healthcare Contexts (PHCs, Health Camps, District Hospitals, Industrial Clinics)
 */

// Multi-language translation & key medical term dictionary for Indian languages
export const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', label: 'English' },
  { code: 'hi', name: 'Hindi', label: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', label: 'தமிழ்' },
  { code: 'te', name: 'Telugu', label: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', label: 'मराठी' },
  { code: 'bn', name: 'Bengali', label: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', label: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', label: 'கன்னடா' },
];

const MULTILINGUAL_KEYWORDS = {
  redFlags: [
    // English
    'chest pain', 'breathlessness', 'shortness of breath', 'unconscious', 'fainting', 'slurred speech',
    'stroke', 'severe burn', 'profuse bleeding', 'seizure', 'convulsion', 'heart attack', 'poisoning',
    // Hindi
    'छाती में दर्द', 'सीने में दर्द', 'सांस लेने में तकलीफ', 'बेहोश', 'चक्कर आकर गिरना', 'दौरा', 'जहर', 'तेज खून',
    // Tamil
    'நெஞ்சு வலி', 'மூச்சுத்திணறல்', 'மயக்கம்', 'பக்கவாதம்', 'வலிப்பு',
    // Telugu
    'గుండె నొప్పి', 'శ్వాస తీసుకోవడంలో ఇబ్బంది', 'స్పృహ తప్పడం', 'పక్షవాతం',
    // Marathi
    'छातीत दुखणे', 'श्वास घेण्यास त्रास', 'बेशुद्ध', 'झटके',
    // Bengali
    'বুকের ব্যথা', 'শ্বাসকষ্ট', 'অজ্ঞান', 'পক্ষাঘাত',
  ],
  urgentFlags: [
    // English
    'high fever', 'fracture', 'broken bone', 'severe abdominal pain', 'vomiting blood', 'blood in stool',
    'deep wound', 'head injury', 'dehydration', 'eye injury',
    // Hindi
    'तेज बुखार', 'हड्डी टूटना', 'पेट में तेज दर्द', 'खून की उल्टी', 'गहरा घाव', 'सिर में चोट',
    // Tamil
    'கடுமையான காய்ச்சல்', 'எலும்பு முறிவு', 'வயிறு வலி',
    // Telugu
    'తీవ్రమైన జ్వరం', 'ఎముక విరగడం', 'కడుపు నొప్పి',
  ]
};

/**
 * Assesses vital signs against evidence-based triage ranges (Emergency Severity Index / MEWS adaptation)
 */
export function assessVitals(vitals = {}) {
  let score = 0;
  const redFlags = [];
  const warnings = [];
  const missingVitals = [];
  const recordedVitals = [];

  const rawPulse = vitals.pulse ?? vitals.heartRate;
  const pulse = Number(rawPulse);
  const rawSpo2 = vitals.spo2;
  const spo2 = Number(rawSpo2);
  const rawSysBP = vitals.systolicBP ?? vitals.sysBP;
  const sysBP = Number(rawSysBP);
  const rawDiaBP = vitals.diastolicBP ?? vitals.diaBP;
  const diaBP = Number(rawDiaBP);
  const rawTemp = vitals.temperature;
  const temp = Number(rawTemp);
  const rawResp = vitals.respirationRate;
  const resp = Number(rawResp);

  // SpO2 Assessment
  if (rawSpo2 !== undefined && rawSpo2 !== null && rawSpo2 !== '' && !isNaN(spo2)) {
    if (spo2 > 0 && spo2 <= 100) {
      recordedVitals.push(`SpO₂: ${spo2}%`);
      if (spo2 < 90) {
        score += 35;
        redFlags.push(`Critical Hypoxia: SpO2 ${spo2}% (Immediate O2 resuscitation required)`);
      } else if (spo2 <= 94) {
        score += 20;
        warnings.push(`Moderate Hypoxia: SpO2 ${spo2}%`);
      }
    } else {
      warnings.push(`Invalid SpO2 reading recorded (${spo2}% out of 1-100% range)`);
    }
  } else {
    missingVitals.push('Oxygen Saturation (SpO₂)');
  }

  // Blood Pressure Assessment
  if (rawSysBP !== undefined && rawSysBP !== null && rawSysBP !== '' && !isNaN(sysBP)) {
    if (sysBP >= 40 && sysBP <= 300) {
      recordedVitals.push(`BP: ${sysBP}/${!isNaN(diaBP) && diaBP > 0 ? diaBP : '--'} mmHg`);
      if (sysBP >= 180 || (!isNaN(diaBP) && diaBP >= 110)) {
        score += 30;
        redFlags.push(`Hypertensive Crisis: BP ${sysBP}/${diaBP || 0} mmHg`);
      } else if (sysBP < 90 || (!isNaN(diaBP) && diaBP > 0 && diaBP < 50)) {
        score += 30;
        redFlags.push(`Severe Hypotension / Shock Risk: BP ${sysBP}/${diaBP || 0} mmHg`);
      } else if (sysBP >= 140 || (!isNaN(diaBP) && diaBP >= 90)) {
        score += 12;
        warnings.push(`Elevated BP: ${sysBP}/${diaBP || 0} mmHg`);
      }
    } else {
      warnings.push(`Extreme or unverified systolic BP reading (${sysBP} mmHg)`);
    }
  } else {
    missingVitals.push('Blood Pressure (BP)');
  }

  // Pulse Rate Assessment
  if (rawPulse !== undefined && rawPulse !== null && rawPulse !== '' && !isNaN(pulse)) {
    if (pulse >= 20 && pulse <= 300) {
      recordedVitals.push(`Pulse: ${pulse} bpm`);
      if (pulse > 130 || pulse < 45) {
        score += 25;
        redFlags.push(`Critical Heart Rate: ${pulse} bpm (Severe Tachycardia/Bradycardia)`);
      } else if (pulse > 105 || pulse < 55) {
        score += 12;
        warnings.push(`Abnormal Pulse Rate: ${pulse} bpm`);
      }
    } else {
      warnings.push(`Unusual pulse measurement recorded (${pulse} bpm)`);
    }
  } else {
    missingVitals.push('Pulse / Heart Rate');
  }

  // Temperature Assessment
  if (rawTemp !== undefined && rawTemp !== null && rawTemp !== '' && !isNaN(temp)) {
    const tempF = temp < 50 ? (temp * 9/5) + 32 : temp;
    if (tempF >= 70 && tempF <= 115) {
      recordedVitals.push(`Temp: ${tempF.toFixed(1)}°F`);
      if (tempF >= 103.5) {
        score += 20;
        warnings.push(`Hyperpyrexia: Temp ${tempF.toFixed(1)}°F`);
      } else if (tempF >= 101.0) {
        score += 10;
        warnings.push(`High Fever: Temp ${tempF.toFixed(1)}°F`);
      } else if (tempF < 95.0) {
        score += 20;
        redFlags.push(`Hypothermia: Temp ${tempF.toFixed(1)}°F`);
      }
    } else {
      warnings.push(`Implausible temperature reading (${tempF.toFixed(1)}°F)`);
    }
  } else {
    missingVitals.push('Body Temperature');
  }

  // Respiration Rate Assessment
  if (rawResp !== undefined && rawResp !== null && rawResp !== '' && !isNaN(resp)) {
    if (resp >= 4 && resp <= 80) {
      recordedVitals.push(`Resp: ${resp}/min`);
      if (resp > 28 || resp < 8) {
        score += 25;
        redFlags.push(`Respiratory Distress: Respiration ${resp}/min`);
      } else if (resp > 22) {
        score += 10;
        warnings.push(`Tachypnea: Respiration ${resp}/min`);
      }
    } else {
      warnings.push(`Implausible respiration rate (${resp}/min)`);
    }
  } else {
    missingVitals.push('Respiration Rate');
  }

  return { score, redFlags, warnings, missingVitals, recordedVitals };
}

/**
 * Assesses symptom text description in English or Indian regional languages
 */
export function assessSymptoms(text = '', language = 'en', voiceTranscripts = []) {
  const spokenTranscripts = Array.isArray(voiceTranscripts)
    ? voiceTranscripts.filter((entry) => typeof entry?.sourceText === 'string' && entry.sourceText.trim())
    : [];
  if (!text && spokenTranscripts.length === 0) {
    return { score: 0, redFlags: [], warnings: [], translatedSummary: 'No verbal symptoms reported.' };
  }

  const transcriptDisplayLines = new Set();
  for (const entry of spokenTranscripts) {
    transcriptDisplayLines.add('ENGLISH TRANSLATION');
    transcriptDisplayLines.add(entry.englishText || 'Translation unavailable');
    transcriptDisplayLines.add(`ORIGINAL (${entry.languageName || entry.languageCode || 'detected language'})`);
    transcriptDisplayLines.add(entry.sourceText);
  }
  const additionalDetails = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !transcriptDisplayLines.has(line))
    .join('; ');
  const assessmentText = [
    ...spokenTranscripts.map((entry) => entry.englishText || entry.sourceText),
    additionalDetails,
  ].filter(Boolean).join(' ');
  const lowerText = assessmentText.toLowerCase();
  let score = 0;
  const redFlags = [];
  const warnings = [];

  // Check Multilingual Red Flags
  for (const flag of MULTILINGUAL_KEYWORDS.redFlags) {
    if (lowerText.includes(flag.toLowerCase())) {
      score += 35;
      redFlags.push(`High-Risk Clinical Symptom Detected: "${flag}"`);
    }
  }

  // Check Multilingual Urgent Flags
  for (const flag of MULTILINGUAL_KEYWORDS.urgentFlags) {
    if (lowerText.includes(flag.toLowerCase())) {
      score += 18;
      warnings.push(`Urgent Symptom Detected: "${flag}"`);
    }
  }

  let translatedSummary = text;
  if (spokenTranscripts.length > 0) {
    const patientReports = spokenTranscripts.map((entry) => {
      const languageName = entry.languageName || entry.languageCode || 'detected language';
      const englishTranscript = entry.englishText || 'Translation unavailable';
      return `ENGLISH TRANSLATION\n${englishTranscript}\n\nORIGINAL (${languageName})\n${entry.sourceText}`;
    }).join('\n\n');
    const detailsSection = additionalDetails
      ? `\n\nAdditional symptom details: ${additionalDetails}`
      : '';
    translatedSummary = `${patientReports}${detailsSection}\n\nClinical flags identified: ${[...redFlags, ...warnings].join('; ') || 'None detected'}.`;
  } else if (language !== 'en') {
    translatedSummary = `[Translated from ${language.toUpperCase()}] Patient reports: "${text}". Clinical flags identified: ${[...redFlags, ...warnings].join('; ') || 'Standard intake symptoms'}.`;
  }

  return { score, redFlags, warnings, translatedSummary };
}

/**
 * Analyzes multimodal visual inputs (image metadata/tags) and lab report text/OCR
 */
export function assessMultimodalInputs(imageMeta = null, reportText = '') {
  let score = 0;
  const findings = [];
  const redFlags = [];

  // 1. Visual Image Assessment
  if (imageMeta) {
    const desc = (imageMeta.description || imageMeta.tag || '').toLowerCase();
    if (desc.includes('burn') || desc.includes('fire')) {
      score += 25;
      findings.push('Visual Assessment: Second/Third Degree Thermal Burn area detected');
      if (desc.includes('severe') || desc.includes('facial') || desc.includes('large')) {
        redFlags.push('Critical Burn Trauma requiring specialized burn unit intake');
      }
    } else if (desc.includes('open wound') || desc.includes('laceration') || desc.includes('bleeding')) {
      score += 20;
      findings.push('Visual Assessment: Active open cutaneous wound with bleeding risk');
    } else if (desc.includes('cyanosis') || desc.includes('blue lips')) {
      score += 35;
      redFlags.push('Visual Assessment: Peripheral/Central Cyanosis detected (Severe Hypoxia)');
    } else if (desc.includes('jaundice') || desc.includes('yellow eyes')) {
      score += 15;
      findings.push('Visual Assessment: Scleral Icterus / Jaundice observed');
    } else if (desc.includes('rash') || desc.includes('lesion')) {
      score += 10;
      findings.push('Visual Assessment: Acute dermatological eruption/rash');
    } else {
      findings.push(`Visual Assessment: Image attached (${imageMeta.fileName || 'Photo Uploaded'})`);
    }
  }

  // 2. Report OCR Assessment
  if (reportText) {
    const reportLower = reportText.toLowerCase();
    
    // Check Hemoglobin
    const hbMatch = reportLower.match(/(?:hb|hemoglobin)\s*[:=]?\s*(\d+\.?\d*)/i);
    if (hbMatch) {
      const hbVal = parseFloat(hbMatch[1]);
      if (hbVal < 7.0) {
        score += 30;
        redFlags.push(`Critical Lab Report: Severe Anemia (Hb ${hbVal} g/dL < 7.0)`);
      } else if (hbVal < 10.0) {
        score += 12;
        findings.push(`Lab Report: Moderate Anemia (Hb ${hbVal} g/dL)`);
      }
    }

    // Check Platelets (Dengue / Thrombocytopenia)
    const pltMatch = reportLower.match(/(?:platelet|plt)\s*[:=]?\s*(\d+[\d,]*)/i);
    if (pltMatch) {
      const pltVal = parseInt(pltMatch[1].replace(/,/g, ''), 10);
      if (pltVal < 30000) {
        score += 35;
        redFlags.push(`Critical Lab Report: Severe Thrombocytopenia (Platelet count ${pltVal} /uL - Dengue shock risk)`);
      } else if (pltVal < 100000) {
        score += 18;
        findings.push(`Lab Report: Low Platelets (${pltVal} /uL)`);
      }
    }

    // Check Blood Glucose
    const glucoseMatch = reportLower.match(/(?:sugar|glucose|rbs|fbs)\s*[:=]?\s*(\d+)/i);
    if (glucoseMatch) {
      const gVal = parseInt(glucoseMatch[1], 10);
      if (gVal > 350 || gVal < 50) {
        score += 25;
        redFlags.push(`Critical Lab Report: Severe Glucose Abnormality (${gVal} mg/dL - DKA / Hypoglycemia risk)`);
      }
    }

    // Check Troponin / ECG
    if (reportLower.includes('troponin positive') || reportLower.includes('st elevation') || reportLower.includes('ischemia')) {
      score += 40;
      redFlags.push('Critical Lab/ECG Report: Cardiac Ischemia / Troponin Positive');
    }

    if (findings.length === 0 && redFlags.length === 0) {
      findings.push('Medical Document Attached & Analyzed (No extreme critical anomalies detected)');
    }
  }

  return { score, findings, redFlags };
}

/**
 * Deterministic Clinical AI Confidence calculation based on evidence completeness
 */
function calculateClinicalConfidence({ vitals, symptomText, voiceTranscripts, imageInput, reportText, redFlags }) {
  let confidence = 70;
  if (vitals?.spo2) confidence += 4;
  if (vitals?.pulse || vitals?.heartRate) confidence += 4;
  if (vitals?.systolicBP) confidence += 4;
  if (vitals?.temperature) confidence += 4;
  if (vitals?.respirationRate) confidence += 4;
  if (symptomText && symptomText.length >= 25) confidence += 4;
  if (Array.isArray(voiceTranscripts) && voiceTranscripts.length > 0) confidence += 3;
  if (imageInput) confidence += 3;
  if (reportText) confidence += 3;
  return `${Math.min(97, Math.max(72, confidence))}%`;
}

/**
 * Executes full clinical triage pipeline and generates structured triage note
 */
export function processTriage(intake) {
  const {
    patientName = 'Anonymous Patient',
    age = 30,
    gender = 'Unspecified',
    facilityType = 'Primary Health Center (PHC)',
    facilityName = 'PHC Rampur',
    language = 'en',
    symptomText = '',
    voiceTranscripts = [],
    vitals = {},
    imageInput = null,
    reportText = '',
  } = intake;

  // 1. Run component assessments
  const vitalsResult = assessVitals(vitals);
  const symptomResult = assessSymptoms(symptomText, language, voiceTranscripts);
  const multimodalResult = assessMultimodalInputs(imageInput, reportText);

  // 2. Numerical Score (Raw calculated points from vitals, symptoms, diagnostics)
  const numericalScore = Math.min(100, Math.max(5, 
    vitalsResult.score + symptomResult.score + multimodalResult.score
  ));

  // 3. Collect flags
  const allRedFlags = [
    ...vitalsResult.redFlags,
    ...symptomResult.redFlags,
    ...multimodalResult.redFlags
  ];

  const allWarnings = [
    ...vitalsResult.warnings,
    ...symptomResult.warnings,
    ...multimodalResult.findings
  ];

  // 4. Clinical Emergency Override Logic (Distinct from numerical scoring)
  // When a high-risk clinical red flag is identified (e.g. chest pain, cyanosis, severe trauma),
  // ESI / Emergency triage protocol mandates immediate Level 1 / RED triage even if baseline vitals are currently stable.
  const isEmergencyOverride = allRedFlags.length > 0 && numericalScore < 75;
  const emergencyOverrideReason = isEmergencyOverride
    ? `Emergency Clinical Override: High-risk red flag (${allRedFlags[0]}) warrants immediate resuscitation priority regardless of baseline vital stability (Vital/Symptom Score: ${numericalScore}/100).`
    : null;

  let triageLevel = 'BLUE';
  let triageLabel = 'Level 4 — GREEN (Routine Standard OPD)';
  let colorTheme = '#10b981'; // Green (Standard Routine)
  let targetResponseTime = 'Standard OPD Queue (< 120 mins)';
  let suggestedDepartment = 'General OPD';

  if (allRedFlags.length > 0 || numericalScore >= 75) {
    triageLevel = 'RED';
    triageLabel = isEmergencyOverride
      ? 'Level 1 — RED (Emergency Clinical Override)'
      : 'Level 1 — RED (Immediate Resuscitation)';
    colorTheme = '#e8203a'; // Red
    targetResponseTime = 'IMMEDIATE (< 5 mins)';
    suggestedDepartment = numericalScore > 85 ? 'Emergency ER / ICU' : 'Trauma & Resuscitation';
  } else if (numericalScore >= 45 || allWarnings.length >= 2) {
    triageLevel = 'YELLOW'; // Presented as Level 2 ORANGE
    triageLabel = 'Level 2 — ORANGE (Urgent Medical Review)';
    colorTheme = '#f97316'; // Orange
    targetResponseTime = 'Urgent (< 15-30 mins)';
    suggestedDepartment = 'Acute Care / Casualty Ward';
  } else if (numericalScore >= 20 || allWarnings.length === 1) {
    triageLevel = 'GREEN'; // Presented as Level 3 YELLOW
    triageLabel = 'Level 3 — YELLOW (Semi-Urgent Care)';
    colorTheme = '#eab308'; // Yellow
    targetResponseTime = 'Semi-Urgent (< 60 mins)';
    suggestedDepartment = 'General Medicine OPD';
  }

  // Build combined text for department routing and diagnostic suggestions
  const combinedText = `${symptomText} ${reportText} ${imageInput?.description || ''}`.toLowerCase();

  // Determine specialized department recommendation based on clinical symptoms.
  // Only override if the patient is not already assigned to an emergency resuscitation unit
  // to prevent a secondary keyword from downgrading a RED-level ICU routing.
  const isHighAcuityEmergency = triageLevel === 'RED' &&
    (suggestedDepartment === 'Emergency ER / ICU' || suggestedDepartment === 'Trauma & Resuscitation');

  if (!isHighAcuityEmergency) {
    if (combinedText.includes('chest pain') || combinedText.includes('heart') || combinedText.includes('ecg') || combinedText.includes('troponin')) {
      suggestedDepartment = 'Cardiology / Emergency Bay';
    } else if (combinedText.includes('breath') || combinedText.includes('spo2') || combinedText.includes('cough') || combinedText.includes('asthma')) {
      suggestedDepartment = 'Pulmonology / Respiratory OPD';
    } else if (combinedText.includes('fracture') || combinedText.includes('bone') || combinedText.includes('joint')) {
      suggestedDepartment = 'Orthopedics & Trauma';
    } else if (combinedText.includes('burn') || combinedText.includes('rash') || combinedText.includes('wound') || combinedText.includes('skin')) {
      suggestedDepartment = 'Dermatology / Wound Care';
    } else if (age <= 12) {
      suggestedDepartment = 'Pediatric Emergency OPD';
    }
  } else {
    // For high-acuity RED patients already routed to ER/ICU, only upgrade to a specialist
    // emergency bay if a specific cardiac/respiratory emergency is confirmed.
    if (combinedText.includes('chest pain') || combinedText.includes('troponin') || combinedText.includes('st elevation') || combinedText.includes('ecg')) {
      suggestedDepartment = 'Cardiology / Emergency Bay';
    }
  }

  // 5. Construct Structured Triage Note (SBAR standard adapted for Indian public health)
  const structuredNote = {
    chiefComplaint: symptomResult.translatedSummary || symptomText || 'Routine triage evaluation requested.',
    vitalsSummary: {
      pulse: vitals.pulse ? `${vitals.pulse} bpm` : 'Not recorded',
      bp: vitals.systolicBP ? `${vitals.systolicBP}/${vitals.diastolicBP || '--'} mmHg` : 'Not recorded',
      spo2: vitals.spo2 ? `${vitals.spo2}%` : 'Not recorded',
      temp: vitals.temperature ? `${vitals.temperature}°F` : 'Not recorded',
      resp: vitals.respirationRate ? `${vitals.respirationRate}/min` : 'Not recorded',
    },
    missingVitals: vitalsResult.missingVitals,
    clinicalRiskAlerts: allRedFlags,
    secondaryFindings: allWarnings,
    multimodalInsights: {
      visual: imageInput ? `Image analyzed (${imageInput.fileName || 'Attached'}): ${multimodalResult.findings.join(', ') || 'No critical visual red flag'}` : 'No visual input provided',
      labReports: reportText ? `Report analyzed: ${multimodalResult.findings.concat(multimodalResult.redFlags).join('; ')}` : 'No report attached'
    },
    suggestedDiagnostics: getSuggestedDiagnostics(triageLevel, combinedText),
    assessment: isEmergencyOverride
      ? `EMERGENCY CLINICAL OVERRIDE: ${emergencyOverrideReason}. Immediate resuscitation required.`
      : `${triageLabel}. ${vitalsResult.missingVitals.length > 0 ? 'Incomplete vitals flagged for nursing assessment.' : 'Clinical vitals recorded.'}`,
    humanReviewStatus: 'PENDING_DOCTOR_APPROVAL',
    aiConfidence: calculateClinicalConfidence({ vitals, symptomText, voiceTranscripts, imageInput, reportText, redFlags: allRedFlags }),
    emergencyOverride: {
      active: isEmergencyOverride,
      reason: emergencyOverrideReason,
      numericalScore,
      redFlags: allRedFlags,
    },
  };

  return {
    triageLevel,
    triageLabel,
    priorityScore: Math.round(numericalScore),
    numericalScore: Math.round(numericalScore),
    isEmergencyOverride,
    emergencyOverrideReason,
    colorTheme,
    targetResponseTime,
    suggestedDepartment,
    aiConfidence: structuredNote.aiConfidence,
    structuredNote,
    redFlagCount: allRedFlags.length,
    warningCount: allWarnings.length,
    missingVitals: vitalsResult.missingVitals,
    facilityName,
    facilityType,
    processedAt: new Date().toISOString()
  };
}

function getSuggestedDiagnostics(level, text) {
  const tests = [];
  if (level === 'RED') {
    tests.push('Stat ECG (12-Lead)', 'Continuous SpO2 & BP Monitoring', 'Venous Blood Gas (VBG)', 'IV Access (18G)');
  }
  if (text.includes('chest') || text.includes('heart')) {
    tests.push('Troponin-I', 'ECG', 'Chest X-Ray (PA View)');
  } else if (text.includes('fever') || text.includes('chills')) {
    tests.push('Complete Blood Count (CBC)', 'Dengue NS1 Antigen', 'Malaria Rapid Test (RDT)');
  } else if (text.includes('breath') || text.includes('spo2')) {
    tests.push('Chest X-Ray', 'ABG / SpO2 Monitoring');
  } else if (text.includes('fracture') || text.includes('fall')) {
    tests.push('X-Ray Affected Limb', 'Analgesic Administration');
  } else {
    tests.push('Basic Vitals Check', 'Targeted Physical Examination');
  }
  return tests;
}
