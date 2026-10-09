'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { getTriageDisplay } from '../../lib/triage-display';
import {
  UserPlus, Activity, FileText, Image as ImageIcon,
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  Check, Clock, ShieldCheck, TrendingUp, MapPin,
  Clipboard, AlertCircle, Heart
} from 'lucide-react';

const FACILITIES = [
  { name: 'PHC Rampur', type: 'Primary Health Center (PHC)' },
  { name: 'Camp Baramati - Rural Health Unit', type: 'Public Health Camp' },
  { name: 'District Hospital Pune', type: 'Government Hospital' },
  { name: 'Jamshedpur Industrial Health Center', type: 'Industrial Clinic' },
  { name: 'IIT Campus Health Center', type: 'Campus Health Center' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', label: 'English', speechLocale: 'en-IN' },
  { code: 'hi', name: 'Hindi', label: 'हिन्दी (Hindi)', speechLocale: 'hi-IN' },
  { code: 'od', name: 'Odia', label: 'ଓଡ଼ିଆ (Odia)', speechLocale: 'or-IN' },
  { code: 'bn', name: 'Bengali', label: 'বাংলা (Bengali)', speechLocale: 'bn-IN' },
  { code: 'te', name: 'Telugu', label: 'తెలుగు (Telugu)', speechLocale: 'te-IN' },
  { code: 'ta', name: 'Tamil', label: 'தமிழ் (Tamil)', speechLocale: 'ta-IN' },
  { code: 'mr', name: 'Marathi', label: 'मराठी (Marathi)', speechLocale: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', label: 'ગુજરાતી (Gujarati)', speechLocale: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', speechLocale: 'pa-IN' },
  { code: 'ur', name: 'Urdu', label: 'اردو (Urdu)', speechLocale: 'ur-IN' },
  { code: 'kn', name: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', speechLocale: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', label: 'മലയാളം (Malayalam)', speechLocale: 'ml-IN' },
  { code: 'as', name: 'Assamese', label: 'অসমীয়া (Assamese)', speechLocale: 'as-IN' },
];

const QUICK_SYMPTOMS = [
  'Severe Chest Pain & Sweating',
  'High Fever 103°F with Chills',
  'Shortness of Breath / Asthma',
  'Suspected Bone Fracture / Trauma',
  'Severe Abdominal Pain & Vomiting',
  'Skin Rash / Severe Burn',
  'Dizziness & Confusion',
  'Routine OPD Checkup / Refill',
];

const STEPS = [
  { num: 1, label: 'Demographics & Facility' },
  { num: 2, label: 'Vital Signs' },
  { num: 3, label: 'Symptoms & Diagnostics' },
  { num: 4, label: 'Triage Result' },
];

function levelColorClass(level) {
  return `level-${getTriageDisplay(level).className}`;
}

function levelTextColor(level) {
  return getTriageDisplay(level).color;
}

function getSpeechLanguage(locale) {
  if (typeof locale !== 'string' || !locale.trim()) return null;
  const normalizedLocale = locale.trim().replace('_', '-');
  const knownLanguage = LANGUAGES.find((language) =>
    language.speechLocale.toLowerCase() === normalizedLocale.toLowerCase()
    || language.code === normalizedLocale.toLowerCase().split('-')[0]
  );
  if (knownLanguage) return knownLanguage;

  const code = normalizedLocale.split('-')[0].toLowerCase();
  if (!/^[a-z]{2,3}$/.test(code)) return null;
  let name = code.toUpperCase();
  try {
    name = new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || name;
  } catch {
    // Keep the language code as the display name when Intl.DisplayNames is unavailable.
  }
  return { code, name, label: name, speechLocale: normalizedLocale };
}

const VOICE_TRANSLATION_CONFIG_ERROR = 'Voice translation is not configured. Please contact the administrator.';

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function voiceRequestErrorMessage(error, fallback) {
  if (error?.status === 503) {
    return VOICE_TRANSLATION_CONFIG_ERROR;
  }
  if (error?.name === 'TypeError') {
    return 'Network connection failed. Please check your connection and try voice input again.';
  }
  return error?.message || fallback;
}

export default function IntakePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslationComplete, setIsTranslationComplete] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const topRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const detectedLanguageRef = useRef(null);
  const fallbackLanguageRef = useRef(null);
  const recognitionErrorRef = useRef('');
  const translationCompleteTimeoutRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: 'Male',
    contact: '',
    facilityName: 'PHC Rampur',
    facilityType: 'Primary Health Center (PHC)',
    language: 'en',
    symptomText: '',
    voiceTranscripts: [],
    vitals: {
      pulse: '',
      systolicBP: '',
      diastolicBP: '',
      spo2: '',
      temperature: '',
      respirationRate: '',
    },
    imageInput: null,
    reportText: '',
  });
  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => () => {
    clearTimeout(translationCompleteTimeoutRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.abort();
    }
  }, []);

  const appendSpeechTranscript = (transcript, sourceText, englishText, language) => {
    setFormData((prev) => ({
      ...prev,
      symptomText: prev.symptomText.trim()
        ? `${prev.symptomText.trim()}\n${transcript}`
        : transcript,
      voiceTranscripts: [...prev.voiceTranscripts, {
        sourceText,
        englishText,
        languageCode: language.code,
        languageName: language.name,
      }],
    }));
    setErrors((prev) => ({ ...prev, symptomText: '' }));
  };

  const translateSpeechTranscript = async (transcript, language) => {
    setIsTranslating(true);
    setSpeechError('');

    try {
      let englishTranscript = '';
      if (language.code === 'en') {
        englishTranscript = transcript;
      } else {
        try {
          const response = await fetch('/api/triage/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcript, sourceLanguage: language.code }),
          });
          const data = await readJsonResponse(response);
          if (response.ok && data.translatedText) {
            englishTranscript = data.translatedText;
          } else {
            englishTranscript = '';
            setSpeechError(data.error || 'Speech recorded in original language. Translation service key not configured.');
          }
        } catch (error) {
          englishTranscript = '';
          setSpeechError(voiceRequestErrorMessage(error, 'English translation failed. Spoken transcript saved in original language.'));
        }
      }

      const displayTranscript = englishTranscript
        ? [
            'ENGLISH TRANSLATION',
            englishTranscript,
            '',
            `ORIGINAL (${language.name})`,
            transcript,
          ].join('\n')
        : [
            'ENGLISH TRANSLATION',
            '[English translation pending / Cloud service unconfigured]',
            '',
            `ORIGINAL (${language.name})`,
            transcript,
          ].join('\n');

      appendSpeechTranscript(displayTranscript, transcript, englishTranscript, language);
      setIsTranslationComplete(true);
      translationCompleteTimeoutRef.current = setTimeout(() => setIsTranslationComplete(false), 2500);
    } catch (error) {
      console.error('Speech translation handling failed:', error);
      setSpeechError(voiceRequestErrorMessage(error, 'Translation could not complete. You can enter or edit symptoms manually.'));
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Voice input is not supported in this browser. Please use Google Chrome or another supported browser.');
      return;
    }

    setSpeechError('');
    clearTimeout(translationCompleteTimeoutRef.current);
    const fallbackLanguage = LANGUAGES.find((language) => language.code === formData.language) || LANGUAGES[0];
    const recognition = new SpeechRecognition();
    recognition.lang = fallbackLanguage.speechLocale;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    detectedLanguageRef.current = null;
    fallbackLanguageRef.current = fallbackLanguage;
    recognitionErrorRef.current = '';
    setInterimTranscript('');
    setIsTranslationComplete(false);

    recognition.onresult = (event) => {
      const finalParts = [];
      const interimParts = [];
      const possibleDetectedLocales = [event.language, event.languageCode, recognition.detectedLanguage];

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const alternative = result[0];
        const spokenText = alternative?.transcript?.trim();
        if (!spokenText) continue;
        if (result.isFinal) finalParts.push(spokenText);
        else interimParts.push(spokenText);
        possibleDetectedLocales.push(result.language, result.languageCode, alternative.language, alternative.languageCode);
      }

      finalTranscriptRef.current = finalParts.join(' ').trim();
      const interimText = interimParts.join(' ').trim();
      interimTranscriptRef.current = interimText || interimTranscriptRef.current;
      setInterimTranscript(interimText);
      detectedLanguageRef.current = possibleDetectedLocales
        .map((locale) => getSpeechLanguage(locale))
        .find(Boolean) || detectedLanguageRef.current;
    };

    recognition.onerror = (event) => {
      recognitionErrorRef.current = event.error || 'recognition-error';
      setIsListening(false);
      setInterimTranscript('');
      setSpeechError(event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'Microphone access was denied. Please allow microphone access and try again.'
        : event.error === 'no-speech'
          ? 'No speech detected. Please try again.'
          : event.error === 'network'
            ? 'Unable to recognize speech. Check your network connection and try again.'
            : event.error === 'language-not-supported'
              ? 'This browser does not support the selected speech language. Choose another language.'
              : 'Unable to recognize speech. Please try again.');
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setIsListening(false);
      setInterimTranscript('');
      if (recognitionErrorRef.current) {
        recognitionErrorRef.current = '';
        return;
      }

      // Use final transcript; fall back to last interim if browser fired onend before isFinal
      const transcript = (finalTranscriptRef.current.trim() || interimTranscriptRef.current.trim());
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      if (!transcript) {
        setSpeechError('No speech detected. Please try again.');
        return;
      }

      const language = detectedLanguageRef.current || fallbackLanguageRef.current || LANGUAGES[0];
      detectedLanguageRef.current = null;
      fallbackLanguageRef.current = null;
      void translateSpeechTranscript(transcript, language);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      recognitionRef.current = null;
      setIsListening(false);
      setSpeechError(error?.name === 'NotAllowedError'
        ? 'Microphone access was denied. Please allow microphone access and try again.'
        : 'Unable to recognize speech. Please try again.');
    }
  };

  const handleFacilityChange = (e) => {
    const selected = FACILITIES.find((f) => f.name === e.target.value);
    if (selected) {
      setFormData((prev) => ({ ...prev, facilityName: selected.name, facilityType: selected.type }));
    }
  };

  const handleVitalsChange = (field, val) => {
    setFormData((prev) => ({ ...prev, vitals: { ...prev.vitals, [field]: val } }));
    // Clear vitals error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const addQuickSymptom = (symptom) => {
    setFormData((prev) => ({
      ...prev,
      symptomText: prev.symptomText ? `${prev.symptomText}; ${symptom}` : symptom,
    }));
    if (errors.symptomText) setErrors((prev) => ({ ...prev, symptomText: '' }));
  };

  const handleImagePreset = (tag, desc) => {
    setFormData((prev) => ({
      ...prev,
      imageInput: { fileName: `${tag.replace(/\s+/g, '_')}_capture.jpg`, tag, description: desc },
    }));
  };

  const handleReportPreset = (presetText) => {
    setFormData((prev) => ({ ...prev, reportText: presetText }));
  };

  // --- Validation ---
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.patientName.trim()) newErrors.patientName = 'Patient name is required';
    if (!formData.age || Number(formData.age) < 0 || Number(formData.age) > 130)
      newErrors.age = 'A valid age (0–130) is required';
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    const { spo2, pulse, systolicBP, diastolicBP, temperature, respirationRate } = formData.vitals;

    if (spo2 !== '' && spo2 !== undefined) {
      const s = Number(spo2);
      if (isNaN(s) || s < 1 || s > 100) {
        newErrors.spo2 = 'SpO₂ must be between 1% and 100%';
      }
    }

    if (pulse !== '' && pulse !== undefined) {
      const p = Number(pulse);
      if (isNaN(p) || p < 20 || p > 300) {
        newErrors.pulse = 'Pulse must be between 20 and 300 bpm';
      }
    }

    const sys = systolicBP !== '' && systolicBP !== undefined ? Number(systolicBP) : null;
    const dia = diastolicBP !== '' && diastolicBP !== undefined ? Number(diastolicBP) : null;

    if (sys !== null) {
      if (isNaN(sys) || sys < 40 || sys > 300) {
        newErrors.systolicBP = 'Systolic BP must be between 40 and 300 mmHg';
      }
    }

    if (dia !== null) {
      if (isNaN(dia) || dia < 20 || dia > 200) {
        newErrors.diastolicBP = 'Diastolic BP must be between 20 and 200 mmHg';
      } else if (sys === null) {
        newErrors.systolicBP = 'Systolic BP is required when Diastolic BP is entered';
      }
    }

    if (sys !== null && dia !== null && !isNaN(sys) && !isNaN(dia)) {
      if (dia >= sys) {
        newErrors.diastolicBP = 'Diastolic BP must be lower than Systolic BP';
      }
    }

    if (temperature !== '' && temperature !== undefined) {
      const t = Number(temperature);
      if (isNaN(t) || t < 70 || t > 115) {
        newErrors.temperature = 'Temperature must be between 70°F and 115°F';
      }
    }

    if (respirationRate !== '' && respirationRate !== undefined) {
      const r = Number(respirationRate);
      if (isNaN(r) || r < 4 || r > 80) {
        newErrors.respirationRate = 'Respiration rate must be between 4 and 80 /min';
      }
    }

    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.symptomText.trim()) newErrors.symptomText = 'Please describe at least one symptom';
    return newErrors;
  };

  const goNext = (validateFn) => {
    const errs = validateFn ? validateFn() : {};
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
    scrollToTop();
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => s - 1);
    scrollToTop();
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      age: '',
      gender: 'Male',
      contact: '',
      facilityName: 'PHC Rampur',
      facilityType: 'Primary Health Center (PHC)',
      language: 'en',
      symptomText: '',
      voiceTranscripts: [],
      vitals: {
        pulse: '',
        systolicBP: '',
        diastolicBP: '',
        spo2: '',
        temperature: '',
        respirationRate: '',
      },
      imageInput: null,
      reportText: '',
    });
    setErrors({});
    setTriageResult(null);
    setSpeechError('');
    setStep(1);
    scrollToTop();
  };

  const handleSubmit = async () => {
    if (loading) return; // Prevent duplicate submission
    const errs = validateStep3();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/triage/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, age: Number(formData.age) }),
      });
      const data = await res.json();
      if (data.success) {
        setTriageResult(data.data);
        setStep(4);
        scrollToTop();
      } else {
        alert(data.error || 'Failed to process triage');
      }
    } catch (err) {
      console.error(err);
      alert('Network error processing triage.');
    } finally {
      setLoading(false);
    }
  };

  const isVitalsCritical = (vitals) => {
    if (!vitals) return false;
    return (
      (vitals.spo2 && Number(vitals.spo2) < 90) ||
      (vitals.systolicBP && Number(vitals.systolicBP) > 180) ||
      (vitals.systolicBP && Number(vitals.systolicBP) < 90) ||
      (vitals.pulse && (Number(vitals.pulse) > 130 || Number(vitals.pulse) < 45))
    );
  };

  return (
    <>
      <Navbar />

      <div className="page-container" ref={topRef}>
        {/* Page Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 className="page-title">
            <UserPlus size={26} color="var(--blue-400)" />
            Patient Triage Intake Kiosk
          </h1>
          <p className="page-subtitle">
            Multimodal symptom recording &amp; automated clinical risk assessment for public health facilities.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="step-progress-bar">
          {STEPS.map((s) => {
            const state = step > s.num ? 'completed' : step === s.num ? 'active' : 'upcoming';
            return (
              <div key={s.num} className={`step-item ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
                <div className={`step-num ${state}`}>
                  {state === 'completed' ? <Check size={14} /> : s.num}
                </div>
                <div className="step-info">
                  <div className={`step-label ${state}`}>{s.label}</div>
                  <div className="step-counter">Step {s.num} of {STEPS.length}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─────────────────────────────────────
            STEP 1: DEMOGRAPHICS & FACILITY
        ───────────────────────────────────── */}
        {step === 1 && (
          <div className="glass-panel">
            <h2 className="section-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} color="var(--blue-400)" /> Patient Details &amp; Facility Context
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {/* Patient Name */}
              <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="patient-name">Patient Name</label>
                <input
                  type="text"
                  id="patient-name"
                    required
                    aria-invalid={Boolean(errors.patientName)}
                    aria-describedby={errors.patientName ? 'patient-name-error' : undefined}
                  className={`form-input ${errors.patientName ? 'error' : ''}`}
                  placeholder="e.g. Ramesh Verma"
                  value={formData.patientName}
                  onChange={(e) => {
                    setFormData({ ...formData, patientName: e.target.value });
                    if (errors.patientName) setErrors((p) => ({ ...p, patientName: '' }));
                  }}
                />
                {errors.patientName && (
                  <div className="form-error" id="patient-name-error">
                    <AlertCircle size={12} /> {errors.patientName}
                  </div>
                )}
              </div>

              {/* Age + Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="patient-age">Age (years)</label>
                  <input
                    type="number"
                    id="patient-age"
                    required
                    aria-invalid={Boolean(errors.age)}
                    aria-describedby={errors.age ? 'patient-age-error' : undefined}
                    className={`form-input ${errors.age ? 'error' : ''}`}
                    placeholder="45"
                    min="0"
                    max="130"
                    value={formData.age}
                    onChange={(e) => {
                      setFormData({ ...formData, age: e.target.value });
                      if (errors.age) setErrors((p) => ({ ...p, age: '' }));
                    }}
                  />
                  {errors.age && (
                    <div className="form-error" id="patient-age-error">
                      <AlertCircle size={12} /> {errors.age}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="patient-gender">Gender</label>
                  <select
                    className="form-select"
                    id="patient-gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div className="form-group">
                <label className="form-label" htmlFor="patient-contact">Contact Number <span style={{ color: '#475569', fontWeight: 500 }}>(optional)</span></label>
                <input
                  type="tel"
                  id="patient-contact"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>

              {/* Facility */}
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="patient-facility">Facility / Health Unit</label>
                <select
                  className="form-select"
                  id="patient-facility"
                  value={formData.facilityName}
                  onChange={handleFacilityChange}
                >
                  {FACILITIES.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="form-group">
                <label className="form-label" htmlFor="patient-language">Speech Language (browser fallback)</label>
                <select
                  className="form-select"
                  id="patient-language"
                  value={formData.language}
                  onChange={(e) => {
                    recognitionRef.current?.stop();
                    setFormData({ ...formData, language: e.target.value });
                  }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
              <button className="btn-primary" onClick={() => goNext(validateStep1)}>
                Vital Signs <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────
            STEP 2: VITALS INPUT
        ───────────────────────────────────── */}
        {step === 2 && (
          <div className="glass-panel">
            <h2 className="section-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="var(--blue-400)" /> Vital Signs Recording
            </h2>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>
              All fields optional — fill in whatever is measurable. Critical thresholds are flagged automatically.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              {/* SpO2 */}
              <div className="form-group">
                <label className="form-label" htmlFor="vital-spo2">Oxygen Saturation (SpO₂ %)</label>
                <input
                  type="number"
                  id="vital-spo2"
                  className="form-input"
                  placeholder="95–100% normal"
                  min="1"
                  max="100"
                  value={formData.vitals.spo2}
                  onChange={(e) => handleVitalsChange('spo2', e.target.value)}
                />
                {errors.spo2 && (
                  <div className="form-error">
                    <AlertCircle size={12} /> {errors.spo2}
                  </div>
                )}
                {Number(formData.vitals.spo2) > 0 && Number(formData.vitals.spo2) < 90 && (
                  <div className="form-error">
                    <AlertTriangle size={12} /> CRITICAL HYPOXIA (&lt;90%)
                  </div>
                )}
                {Number(formData.vitals.spo2) >= 90 && Number(formData.vitals.spo2) < 95 && (
                  <div style={{ color: 'var(--yellow-400)', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <AlertCircle size={12} /> Low-normal, monitor closely
                  </div>
                )}
              </div>

              {/* Pulse */}
              <div className="form-group">
                <label className="form-label" htmlFor="vital-pulse">Heart / Pulse Rate (bpm)</label>
                <input
                  type="number"
                  id="vital-pulse"
                  className="form-input"
                  placeholder="60–100 normal"
                  value={formData.vitals.pulse}
                  onChange={(e) => handleVitalsChange('pulse', e.target.value)}
                />
                {errors.pulse && (
                  <div className="form-error">
                    <AlertCircle size={12} /> {errors.pulse}
                  </div>
                )}
                {Number(formData.vitals.pulse) > 130 && (
                  <div className="form-error"><AlertTriangle size={12} /> Tachycardia (&gt;130)</div>
                )}
                {Number(formData.vitals.pulse) > 0 && Number(formData.vitals.pulse) < 40 && (
                  <div className="form-error"><AlertTriangle size={12} /> Bradycardia (&lt;40)</div>
                )}
              </div>

              {/* Systolic BP */}
              <div className="form-group">
                <label className="form-label" htmlFor="vital-systolic">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  id="vital-systolic"
                  className="form-input"
                  placeholder="90–120 normal"
                  value={formData.vitals.systolicBP}
                  onChange={(e) => handleVitalsChange('systolicBP', e.target.value)}
                />
                {errors.systolicBP && (
                  <div className="form-error">
                    <AlertCircle size={12} /> {errors.systolicBP}
                  </div>
                )}
                {Number(formData.vitals.systolicBP) > 180 && (
                  <div className="form-error"><AlertTriangle size={12} /> Hypertensive crisis (&gt;180)</div>
                )}
                {Number(formData.vitals.systolicBP) > 0 && Number(formData.vitals.systolicBP) < 90 && (
                  <div className="form-error"><AlertTriangle size={12} /> Hypotension (&lt;90)</div>
                )}
              </div>

              {/* Diastolic BP */}
              <div className="form-group">
                <label className="form-label" htmlFor="vital-diastolic">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  id="vital-diastolic"
                  className="form-input"
                  placeholder="60–80 normal"
                  value={formData.vitals.diastolicBP}
                  onChange={(e) => handleVitalsChange('diastolicBP', e.target.value)}
                />
                {errors.diastolicBP && (
                  <div className="form-error">
                    <AlertCircle size={12} /> {errors.diastolicBP}
                  </div>
                )}
              </div>

              {/* Temperature */}
              <div className="form-group">
                <label className="form-label" htmlFor="vital-temperature">Temperature (°F)</label>
                <input
                  type="number"
                  id="vital-temperature"
                  step="0.1"
                  className="form-input"
                  placeholder="98.6 normal"
                  value={formData.vitals.temperature}
                  onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                />
                {errors.temperature && (
                  <div className="form-error">
                    <AlertCircle size={12} /> {errors.temperature}
                  </div>
                )}
                {Number(formData.vitals.temperature) > 104 && (
                  <div className="form-error"><AlertTriangle size={12} /> Hyperpyrexia (&gt;104°F)</div>
                )}
              </div>

              {/* Respiration Rate */}
              <div className="form-group">
                <label className="form-label" htmlFor="vital-respiration">Respiration Rate (/min)</label>
                <input
                  type="number"
                  id="vital-respiration"
                  className="form-input"
                  placeholder="12–20 normal"
                  value={formData.vitals.respirationRate}
                  onChange={(e) => handleVitalsChange('respirationRate', e.target.value)}
                />
                {errors.respirationRate && (
                  <div className="form-error">
                    <AlertCircle size={12} /> {errors.respirationRate}
                  </div>
                )}
                {Number(formData.vitals.respirationRate) > 25 && (
                  <div className="form-error"><AlertTriangle size={12} /> Tachypnea (&gt;25/min)</div>
                )}
              </div>
            </div>

            {/* Critical vitals summary notice */}
            {isVitalsCritical(formData.vitals) && (
              <div style={{
                marginTop: '20px',
                padding: '14px 18px',
                background: 'rgba(232, 32, 58, 0.1)',
                border: '1px solid rgba(232, 32, 58, 0.4)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--red-400)',
              }}>
                <AlertTriangle size={16} />
                Critical vitals detected — this patient may need immediate attention
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={goBack}>
                <ChevronLeft size={18} /> Back
              </button>
              <button className="btn-primary" onClick={() => goNext(validateStep2)}>
                Symptoms &amp; Diagnostics <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────
            STEP 3: MULTIMODAL SYMPTOMS
        ───────────────────────────────────── */}
        {step === 3 && (
          <div className="glass-panel">
            <h2 className="section-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="var(--blue-400)" /> Multimodal Symptoms &amp; Diagnostics
            </h2>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>
              Select quick symptom presets, describe in free text, or attach image and lab report evidence.
            </p>

            {/* Quick Symptom Chips */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Quick Symptom Presets</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {QUICK_SYMPTOMS.map((qs) => (
                  <button
                    key={qs}
                    type="button"
                    onClick={() => addQuickSymptom(qs)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '20px',
                      background: formData.symptomText?.includes(qs)
                        ? 'var(--blue-bg)'
                        : 'rgba(30, 41, 59, 0.8)',
                      border: formData.symptomText?.includes(qs)
                        ? '1px solid var(--blue-border)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: formData.symptomText?.includes(qs) ? 'var(--blue-400)' : '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    + {qs}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptom Description */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <label className="form-label form-label-required" htmlFor="symptom-description">Patient Symptom Description</label>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={toggleVoiceInput}
                  disabled={isTranslating}
                  aria-pressed={isListening}
                  aria-label={isListening ? 'Stop listening' : 'Speak symptoms in any language'}
                  aria-live="polite"
                >
                  {isListening
                    ? '🔴 Stop Listening'
                    : isTranslating
                      ? '🌐 Translating...'
                      : isTranslationComplete
                        ? '✓ Translation complete'
                        : '🎙️ Speak Any Language'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                Speak naturally in your preferred language. TriageX will convert your speech to text and provide an English translation for clinical assessment.
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                Browser speech recognition may not detect language automatically. Select a Speech Language fallback above when needed.
              </p>
              <textarea
                id="symptom-description"
                required
                aria-invalid={Boolean(errors.symptomText)}
                aria-describedby={errors.symptomText ? 'symptom-description-error' : undefined}
                className={`form-textarea ${errors.symptomText ? 'error' : ''}`}
                rows={4}
                placeholder="Describe symptoms in English or regional language (e.g. हिन्दी: सीने में तेज दर्द...)"
                value={formData.symptomText}
                onChange={(e) => {
                  setFormData({ ...formData, symptomText: e.target.value });
                  if (errors.symptomText) setErrors((p) => ({ ...p, symptomText: '' }));
                }}
              />
              {speechError && <div className="form-error" role="status">{speechError}</div>}
              {isListening && <div style={{ color: 'var(--blue-400)', fontSize: '12px', marginTop: '6px' }} role="status">🎙️ Listening...</div>}
              {isListening && interimTranscript && <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }} aria-live="polite">{interimTranscript}</div>}
              {isTranslating && <div style={{ color: 'var(--blue-400)', fontSize: '12px', marginTop: '6px' }} role="status">🌐 Translating...</div>}
              {errors.symptomText && (
                <div className="form-error" id="symptom-description-error">
                  <AlertCircle size={12} /> {errors.symptomText}
                </div>
              )}
            </div>

            {/* Visual & Lab Report Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '8px' }}>
              {/* Camera / Image Input */}
              <div className="glass-card">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} color="var(--blue-400)" /> Visual Input / Camera Capture
                </label>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: 1.5 }}>
                  Attach photo for visible wounds, rashes, burns, or cyanosis.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { tag: 'burn', label: '📷 Preset: Scald Burn Image', desc: 'Second degree thermal scald burn on forearm' },
                    { tag: 'open wound', label: '📷 Preset: Open Laceration Photo', desc: 'Laceration on right leg with bleeding' },
                  ].map((preset) => (
                    <button
                      key={preset.tag}
                      type="button"
                      onClick={() => handleImagePreset(preset.tag, preset.desc)}
                      style={{
                        padding: '9px 12px',
                        background: formData.imageInput?.tag === preset.tag ? 'var(--blue-bg)' : 'rgba(15, 23, 42, 0.8)',
                        border: formData.imageInput?.tag === preset.tag ? '1px solid var(--blue-500)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {formData.imageInput && (
                  <div style={{ fontSize: '12px', color: '#34d399', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <Check size={12} /> {formData.imageInput.fileName}
                  </div>
                )}
              </div>

              {/* Lab Report Upload */}
              <div className="glass-card">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="var(--blue-400)" /> Lab Report Upload / OCR
                </label>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: 1.5 }}>
                  Paste or parse uploaded lab reports (CBC, Dengue, ECG, Blood Sugar).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: '📄 Load Sample Anemia CBC Report', text: 'Lab CBC Report: Hemoglobin = 6.2 g/dL (CRITICAL ANEMIA), WBC = 14,000 /uL.' },
                    { label: '📄 Load Sample Dengue Report', text: 'Dengue NS1 Antigen: POSITIVE. Platelet Count = 28,000 /uL.' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleReportPreset(preset.text)}
                      style={{
                        padding: '9px 12px',
                        background: formData.reportText === preset.text ? 'var(--blue-bg)' : 'rgba(15, 23, 42, 0.8)',
                        border: formData.reportText === preset.text ? '1px solid var(--blue-500)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {formData.reportText && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', lineHeight: 1.5 }}>
                    {formData.reportText.substring(0, 80)}…
                  </div>
                )}
              </div>
            </div>

            {formData.reportText && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label" htmlFor="parsed-report">Parsed Report Content</label>
                <textarea
                  id="parsed-report"
                  className="form-textarea"
                  rows={2}
                  value={formData.reportText}
                  onChange={(e) => setFormData({ ...formData, reportText: e.target.value })}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={goBack}>
                <ChevronLeft size={18} /> Back
              </button>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading || isListening || isTranslating}>
                {loading ? (
                  <><RefreshCw className="spin" size={18} /> Processing…</>
                ) : (
                  <>Submit &amp; Generate Triage <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────
            STEP 4: TRIAGE RESULT SCREEN
        ───────────────────────────────────── */}
        {step === 4 && triageResult && (() => {
          const level = triageResult.triageLevel?.toUpperCase();
          const color = levelTextColor(level);
          return (
            <div>
              {/* ──── Big Status Hero Card ──── */}
              <div className={`triage-status-card ${levelColorClass(level)}`} style={{ marginBottom: '24px' }}>
                {/* Decorative pulse ring */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: `radial-gradient(circle at 50% 50%, ${color}12, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative' }}>
                  {/* Level Badge */}
                  <div
                    className="triage-level-badge-large"
                    style={{ background: `${color}20`, color: color, border: `1px solid ${color}55` }}
                  >
                    {getTriageDisplay(level).name}
                  </div>

                  {/* Main Triage Level Text */}
                  <div className="triage-level-text" style={{ color }}>
                    {level === 'RED' && 'IMMEDIATE'}
                    {level === 'YELLOW' && 'URGENT'}
                    {level === 'GREEN' && 'SEMI-URGENT'}
                    {level === 'BLUE' && 'ROUTINE'}
                  </div>

                  {/* Subtitle */}
                  <div style={{ fontSize: '15px', color: '#94a3b8', marginTop: '10px', fontWeight: 500 }}>
                    {triageResult.patientName} • {triageResult.age}y {triageResult.gender}
                  </div>

                  {/* Priority Score + Target Time */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '24px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '42px', fontWeight: 900, color, lineHeight: 1, letterSpacing: '0' }}>
                        {triageResult.priorityScore}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0' }}>
                        Priority Score / 100
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1, letterSpacing: '0' }}>
                        {triageResult.targetResponseTime}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0' }}>
                        Target Response
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--yellow-400)', lineHeight: 1 }}>
                        ⏳
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0' }}>
                        Pending Review
                      </div>
                    </div>
                  </div>

                  {/* Emergency Override Banner */}
                  {triageResult.isEmergencyOverride && (
                    <div style={{
                      marginTop: '16px',
                      padding: '10px 16px',
                      background: 'rgba(232, 32, 58, 0.15)',
                      border: '1px solid rgba(232, 32, 58, 0.4)',
                      borderRadius: '8px',
                      color: '#fca5a5',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left'
                    }}>
                      <AlertTriangle size={16} color="var(--red-400)" style={{ flexShrink: 0 }} />
                      <span>{triageResult.emergencyOverrideReason}</span>
                    </div>
                  )}

                  {/* Queue Token */}
                  <div style={{ marginTop: '20px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                    Queue Token: <span style={{ color: '#94a3b8', fontWeight: 700 }}>{triageResult.id}</span>
                    &nbsp;·&nbsp;Facility: {triageResult.facilityName}
                  </div>
                </div>
              </div>

              {/* ──── Detail Cards Grid ──── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Chief Complaint */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue-400)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clipboard size={14} /> Chief Complaint
                    </h3>
                    <p style={{ fontSize: '14px', color: '#dde4ef', lineHeight: 1.7 }}>
                      {triageResult.structuredNote?.chiefComplaint}
                    </p>
                  </div>

                  {/* Clinical Risk Alerts */}
                  {triageResult.structuredNote?.clinicalRiskAlerts?.length > 0 && (
                    <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(232, 32, 58, 0.4)', background: 'rgba(232, 32, 58, 0.06)' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--red-400)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={14} /> Critical Risk Alerts
                      </h3>
                      <ul style={{ paddingLeft: '18px', color: '#fca5a5', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {triageResult.structuredNote.clinicalRiskAlerts.map((alt, idx) => (
                          <li key={idx} style={{ lineHeight: 1.5 }}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue-400)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={14} /> Clinical Evidence &amp; Vitals
                    </h3>
                    <div className="result-vitals-grid">
                      {Object.entries(triageResult.structuredNote?.vitalsSummary || {}).map(([label, value]) => (
                        <div key={label} className="result-vital-item">
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                    {triageResult.structuredNote?.secondaryFindings?.length > 0 && (
                      <ul className="result-evidence-list">
                        {triageResult.structuredNote.secondaryFindings.map((finding, index) => (
                          <li key={`${finding}-${index}`}>{finding}</li>
                        ))}
                      </ul>
                    )}
                    {triageResult.structuredNote?.missingVitals?.length > 0 && (
                      <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--yellow-400)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <AlertCircle size={13} /> Missing vitals requiring evaluation: {triageResult.structuredNote.missingVitals.join(', ')}
                      </div>
                    )}
                    {triageResult.structuredNote?.multimodalInsights && (
                      <div className="result-evidence-notes">
                        <p>{triageResult.structuredNote.multimodalInsights.visual}</p>
                        <p>{triageResult.structuredNote.multimodalInsights.labReports}</p>
                      </div>
                    )}
                  </div>

                  {/* Diagnostics */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue-400)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} /> Suggested Diagnostics
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {triageResult.structuredNote?.suggestedDiagnostics?.map((diag, idx) => (
                        <span key={idx} style={{
                          padding: '5px 11px',
                          background: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#7dd3fc',
                          fontWeight: 600,
                        }}>
                          {diag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* AI Decision Summary */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Heart size={14} /> Clinical Decision Summary
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Risk Level</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color }}>
                          {level === 'RED' ? 'HIGH (EMERGENCY)' : level === 'YELLOW' ? 'MODERATE (URGENT)' : level === 'GREEN' ? 'LOW (SEMI-URGENT)' : 'ROUTINE'}
                        </span>
                      </div>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Recommended Action</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', textAlign: 'right', maxWidth: '180px' }}>
                          {level === 'RED' ? 'Immediate Resuscitation' : level === 'YELLOW' ? 'Urgent Medical Review' : level === 'GREEN' ? 'Semi-Urgent OPD' : 'Routine Consultation'}
                        </span>
                      </div>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Dept</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', textAlign: 'right', maxWidth: '180px' }}>
                          {triageResult.suggestedDepartment}
                        </span>
                      </div>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Confidence</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
                          {triageResult.structuredNote?.aiConfidence || '88%'}
                        </span>
                      </div>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Human Review</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--yellow-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Pending Doctor Confirmation
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {triageResult.structuredNote?.aiExplanation && (
                    <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--blue-400)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0' }}>
                        Clinical Protocol Notes
                      </h3>
                      <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.65 }}>
                        {triageResult.structuredNote.aiExplanation}
                      </p>
                    </div>
                  )}

                  {/* Location & Routing */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> Routing &amp; Response
                    </h3>
                    <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div><span style={{ color: '#64748b' }}>Facility:</span> <strong style={{ color: '#f1f5f9' }}>{triageResult.facilityName}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Department:</span> <strong style={{ color: '#f1f5f9' }}>{triageResult.suggestedDepartment}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Target Response:</span> <strong style={{ color }}>{triageResult.targetResponseTime}</strong></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <a href="/dashboard" className="btn-primary" style={{ justifyContent: 'center' }}>
                      <ShieldCheck size={18} /> Go to Clinician Queue →
                    </a>
                    <button
                      className="btn-secondary"
                      style={{ justifyContent: 'center' }}
                      onClick={resetForm}
                    >
                      Register Another Patient
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
