'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import { UserPlus, Activity, FileText, Image as ImageIcon, AlertTriangle, RefreshCw } from 'lucide-react';

const FACILITIES = [
  { name: 'PHC Rampur', type: 'Primary Health Center (PHC)' },
  { name: 'Camp Baramati - Rural Health Unit', type: 'Public Health Camp' },
  { name: 'District Hospital Pune', type: 'Government Hospital' },
  { name: 'Jamshedpur Industrial Health Center', type: 'Industrial Clinic' },
  { name: 'IIT Campus Health Center', type: 'Campus Health Center' }
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'od', label: 'ଓଡ଼ିଆ (Odia)' },
];

const QUICK_SYMPTOMS = [
  'Severe Chest Pain & Sweating',
  'High Fever 103°F with Chills',
  'Shortness of Breath / Asthma',
  'Suspected Bone Fracture / Trauma',
  'Severe Abdominal Pain & Vomiting',
  'Skin Rash / Severe Burn',
  'Dizziness & Confusion',
  'Routine OPD Checkup / Refill'
];

export default function IntakePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

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
    vitals: {
      pulse: '',
      systolicBP: '',
      diastolicBP: '',
      spo2: '',
      temperature: '',
      respirationRate: ''
    },
    imageInput: null,
    reportText: ''
  });

  const handleFacilityChange = (e) => {
    const selected = FACILITIES.find(f => f.name === e.target.value);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        facilityName: selected.name,
        facilityType: selected.type
      }));
    }
  };

  const handleVitalsChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      vitals: { ...prev.vitals, [field]: val }
    }));
  };

  const addQuickSymptom = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptomText: prev.symptomText ? `${prev.symptomText}; ${symptom}` : symptom
    }));
  };

  const handleImagePreset = (tag, desc) => {
    setFormData(prev => ({
      ...prev,
      imageInput: {
        fileName: `${tag.replace(/\s+/g, '_')}_capture.jpg`,
        tag,
        description: desc
      }
    }));
  };

  const handleReportPreset = (presetText) => {
    setFormData(prev => ({
      ...prev,
      reportText: presetText
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/triage/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age || 30)
        })
      });

      const data = await res.json();
      if (data.success) {
        setTriageResult(data.data);
        setStep(4); // View result
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

  return (
    <>
      <Navbar />

      <div className="page-container">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800 }}>Patient Triage Intake Kiosk</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Multimodal symptom recording & automated clinical risk assessment for public health facilities.
          </p>
        </div>

        {/* Responsive Step Indicator */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '32px'
        }}>
          {[
            { num: 1, label: 'Demographics & Facility' },
            { num: 2, label: 'Vital Signs' },
            { num: 3, label: 'Multimodal Symptoms' },
            { num: 4, label: 'Triage Summary Note' }
          ].map(s => (
            <div
              key={s.num}
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: step === s.num ? 'rgba(255, 41, 72, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                border: step === s.num ? '1px solid #ff2948' : '1px solid rgba(255, 255, 255, 0.08)',
                color: step === s.num ? '#ff2948' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: step === s.num ? '#ff2948' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                flexShrink: 0
              }}>
                {s.num}
              </div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: DEMOGRAPHICS & FACILITY */}
        {step === 1 && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} color="#ff2948" /> Step 1: Patient Details & Facility Context
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Patient Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Verma"
                  value={formData.patientName}
                  onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="45"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Facility / Health Unit Context</label>
                <select
                  className="form-select"
                  value={formData.facilityName}
                  onChange={handleFacilityChange}
                >
                  {FACILITIES.map(f => (
                    <option key={f.name} value={f.name}>{f.name} ({f.type})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Language</label>
                <select
                  className="form-select"
                  value={formData.language}
                  onChange={e => setFormData({ ...formData, language: e.target.value })}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                className="btn-primary"
                onClick={() => setStep(2)}
              >
                Proceed to Vitals &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VITALS INPUT */}
        {step === 2 && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#ff2948" /> Step 2: Vital Signs Recording
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Oxygen Saturation (SpO2 %)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 88 (Normal: 95-100%)"
                  value={formData.vitals.spo2}
                  onChange={e => handleVitalsChange('spo2', e.target.value)}
                />
                {Number(formData.vitals.spo2) > 0 && Number(formData.vitals.spo2) < 90 && (
                  <span style={{ color: '#f87171', fontSize: '12px', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                    ⚠️ CRITICAL HYPOXIA ALERT (&lt;90%)
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Heart / Pulse Rate (bpm)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 110"
                  value={formData.vitals.pulse}
                  onChange={e => handleVitalsChange('pulse', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 170"
                  value={formData.vitals.systolicBP}
                  onChange={e => handleVitalsChange('systolicBP', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 105"
                  value={formData.vitals.diastolicBP}
                  onChange={e => handleVitalsChange('diastolicBP', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 102.5"
                  value={formData.vitals.temperature}
                  onChange={e => handleVitalsChange('temperature', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Respiration Rate (/min)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 24"
                  value={formData.vitals.respirationRate}
                  onChange={e => handleVitalsChange('respirationRate', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', marginTop: '24px' }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>
                &larr; Back
              </button>
              <button className="btn-primary" onClick={() => setStep(3)}>
                Proceed to Symptoms & Multimodal Inputs &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MULTIMODAL SYMPTOMS INPUT */}
        {step === 3 && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#ff2948" /> Step 3: Multimodal Symptoms & Diagnostics
            </h2>

            {/* Quick Symptom Chips */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Quick Symptom Presets</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {QUICK_SYMPTOMS.map(qs => (
                  <button
                    key={qs}
                    type="button"
                    onClick={() => addQuickSymptom(qs)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + {qs}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Patient Symptom Description (Text or Vernacular)</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Describe patient symptoms in English or regional language (e.g. हिन्दी: सीने में तेज दर्द...)"
                value={formData.symptomText}
                onChange={e => setFormData({ ...formData, symptomText: e.target.value })}
              />
            </div>

            {/* Visual Photo Input Simulator */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '24px' }}>
              <div className="glass-card">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={16} color="#ff2948" /> Visual Input / Camera Capture
                </label>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                  Attach photo for visible wounds, rashes, burns, or cyanosis.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleImagePreset('burn', 'Second degree thermal scald burn on forearm')}
                    style={{
                      padding: '8px',
                      background: formData.imageInput?.tag === 'burn' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                      border: formData.imageInput?.tag === 'burn' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      textAlign: 'left'
                    }}
                  >
                    📷 Preset: Scald Burn Image
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImagePreset('open wound', 'Laceration on right leg with bleeding')}
                    style={{
                      padding: '8px',
                      background: formData.imageInput?.tag === 'open wound' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                      border: formData.imageInput?.tag === 'open wound' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      textAlign: 'left'
                    }}
                  >
                    📷 Preset: Open Laceration Photo
                  </button>
                </div>
                {formData.imageInput && (
                  <span style={{ fontSize: '12px', color: '#34d399', marginTop: '8px', display: 'block' }}>
                    ✓ Image attached: {formData.imageInput.fileName}
                  </span>
                )}
              </div>

              {/* Lab Report Upload / OCR Parser Simulator */}
              <div className="glass-card">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="#3b82f6" /> Lab Report Upload / OCR
                </label>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                  Paste or parse uploaded lab reports (CBC, Dengue, ECG, Blood Sugar).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleReportPreset('Lab CBC Report: Hemoglobin = 6.2 g/dL (CRITICAL ANEMIA), WBC = 14,000 /uL.')}
                    style={{
                      padding: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      textAlign: 'left'
                    }}
                  >
                    📄 Load Sample Anemia CBC Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportPreset('Dengue NS1 Antigen: POSITIVE. Platelet Count = 28,000 /uL.')}
                    style={{
                      padding: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      textAlign: 'left'
                    }}
                  >
                    📄 Load Sample Dengue Report
                  </button>
                </div>
              </div>
            </div>

            {formData.reportText && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Report Text Content</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={formData.reportText}
                  onChange={e => setFormData({ ...formData, reportText: e.target.value })}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', marginTop: '24px' }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>
                &larr; Back
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <RefreshCw className="spin" size={18} /> : 'Submit Intake & Generate Triage Note'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: TRIAGE RESULT NOTE */}
        {step === 4 && triageResult && (
          <div className="glass-panel" style={{ border: `1px solid ${triageResult.colorTheme}` }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div>
                <span className={`badge-${triageResult.triageLevel.toLowerCase()}`}>
                  {triageResult.triageLabel}
                </span>
                <h2 style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, marginTop: '8px' }}>
                  Queue Token: {triageResult.id}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Patient: {triageResult.patientName} ({triageResult.age}y {triageResult.gender}) • {triageResult.facilityName}
                </p>
              </div>

              <div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: triageResult.colorTheme }}>
                  {triageResult.priorityScore} <span style={{ fontSize: '14px', color: '#94a3b8' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Priority Queue Score</div>
              </div>
            </div>

            {/* SBAR Clinical Note Structure (Responsive Auto-Fit Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <div className="glass-card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ff2948', marginBottom: '8px' }}>
                    CHIEF COMPLAINT & VERNACULAR SUMMARY
                  </h3>
                  <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.6 }}>
                    {triageResult.structuredNote.chiefComplaint}
                  </p>
                </div>

                {triageResult.structuredNote.clinicalRiskAlerts.length > 0 && (
                  <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={16} /> CRITICAL CLINICAL RISK ALERTS
                    </h3>
                    <ul style={{ paddingLeft: '20px', color: '#fca5a5', fontSize: '13px' }}>
                      {triageResult.structuredNote.clinicalRiskAlerts.map((alt, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="glass-card">
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                    SUGGESTED INITIAL DIAGNOSTICS & ACTIONS
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {triageResult.structuredNote.suggestedDiagnostics.map((diag, idx) => (
                      <span key={idx} style={{
                        padding: '4px 10px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#7dd3fc'
                      }}>
                        {diag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Summary */}
              <div>
                <div className="glass-card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginBottom: '12px' }}>
                    ROUTING & RESPONSE
                  </h3>
                  <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                    <strong>Recommended Dept:</strong> <br />
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{triageResult.suggestedDepartment}</span>
                  </div>
                  <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                    <strong>Target Response:</strong> <br />
                    <span style={{ color: triageResult.colorTheme, fontWeight: 700 }}>{triageResult.targetResponseTime}</span>
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>Human Review:</strong> <br />
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>Pending Doctor Confirmation</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a href="/dashboard" className="btn-primary" style={{ justifyContent: 'center' }}>
                    Go to Doctor Triage Queue &rarr;
                  </a>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setStep(1);
                      setTriageResult(null);
                    }}
                  >
                    Register Another Patient
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
