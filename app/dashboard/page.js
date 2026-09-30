'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
  Stethoscope, Search, ShieldCheck, Edit3, Plus, Check, RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Filters
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected patient for modal dossier review
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    triageLevel: '',
    suggestedDepartment: '',
    doctorNotes: '',
    reviewedBy: 'Dr. S. Kulkarni (Medical Officer)'
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const url = `/api/triage/queue?facilityType=${facilityFilter}&triageLevel=${levelFilter}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setQueue(data.data);
      }
      const statsRes = await fetch('/api/triage/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const url = `/api/triage/queue?facilityType=${facilityFilter}&triageLevel=${levelFilter}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (active && data.success) {
          setQueue(data.data);
        }
        const statsRes = await fetch('/api/triage/stats');
        const statsData = await statsRes.json();
        if (active && statsData.success) {
          setStats(statsData.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => { active = false; };
  }, [facilityFilter, levelFilter, statusFilter, searchQuery]);

  const handleSimulateIntake = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/triage/simulate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const openPatientModal = (patient) => {
    setSelectedPatient(patient);
    setReviewForm({
      triageLevel: patient.triageLevel,
      suggestedDepartment: patient.suggestedDepartment || 'General Medicine OPD',
      doctorNotes: patient.doctorNotes || '',
      reviewedBy: patient.reviewedBy || 'Dr. S. Kulkarni (Medical Officer)'
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const res = await fetch(`/api/triage/review/${selectedPatient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewForm,
          status: 'DOCTOR_REVIEWED'
        })
      });

      const data = await res.json();
      if (data.success) {
        setSelectedPatient(null);
        loadDashboardData();
      } else {
        alert(data.error || 'Review submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating patient review.');
    }
  };

  return (
    <>
      <Navbar />

      <div className="page-container">
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Stethoscope size={28} color="#ff2948" /> Clinician Triage Command Center
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
              Human-in-the-loop priority queue management & clinical dossier review for health facilities.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              className="btn-secondary"
              onClick={handleSimulateIntake}
              disabled={simulating}
            >
              {simulating ? <RefreshCw className="spin" size={16} /> : <Plus size={16} />}
              Simulate Live Intake Stream
            </button>

            <button className="btn-primary" onClick={loadDashboardData}>
              <RefreshCw size={16} />
              Refresh Queue
            </button>
          </div>
        </div>

        {/* Stats Summary Cards (Responsive Auto-Fit Grid) */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div className="glass-card">
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>ACTIVE QUEUE</div>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>{stats.totalPatients}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Across all facilities</div>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>LEVEL 1 - RED</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>{stats.redCount}</div>
              <div style={{ fontSize: '12px', color: '#fca5a5' }}>Immediate Resuscitation</div>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>LEVEL 2 - YELLOW</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>{stats.yellowCount}</div>
              <div style={{ fontSize: '12px', color: '#fde68a' }}>Urgent Medical Review</div>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>LEVEL 3 - GREEN</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>{stats.greenCount}</div>
              <div style={{ fontSize: '12px', color: '#a7f3d0' }}>Semi-Urgent OPD</div>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa' }}>PENDING REVIEW</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#60a5fa', marginTop: '4px' }}>{stats.pendingCount}</div>
              <div style={{ fontSize: '12px', color: '#bfdbfe' }}>Awaiting Doctor Signal</div>
            </div>
          </div>
        )}

        {/* Filter Bar (Responsive Auto-Fit Grid) */}
        <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search patient, ID, or symptoms..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Level Filter */}
            <select
              className="form-select"
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
            >
              <option value="ALL">All Triage Levels</option>
              <option value="RED">Level 1 - RED (Emergency)</option>
              <option value="YELLOW">Level 2 - YELLOW (Urgent)</option>
              <option value="GREEN">Level 3 - GREEN (Semi-Urgent)</option>
              <option value="BLUE">Level 4 - BLUE (Non-Urgent)</option>
            </select>

            {/* Status Filter */}
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_DOCTOR_APPROVAL">Pending Doctor Review</option>
              <option value="DOCTOR_REVIEWED">Doctor Reviewed & Confirmed</option>
            </select>

            {/* Facility Filter */}
            <select
              className="form-select"
              value={facilityFilter}
              onChange={e => setFacilityFilter(e.target.value)}
            >
              <option value="ALL">All Health Facilities</option>
              <option value="Primary Health Center (PHC)">PHCs</option>
              <option value="Public Health Camp">Public Health Camps</option>
              <option value="Government Hospital">Government Hospitals</option>
              <option value="Industrial Clinic">Industrial Clinics</option>
              <option value="Campus Health Center">Campus Clinics</option>
            </select>
          </div>
        </div>

        {/* Prioritized Patient Queue Table (Responsive Wrapper) */}
        <div className="glass-panel responsive-table-wrapper" style={{ padding: 0 }}>
          <table className="triage-table">
            <thead>
              <tr>
                <th>Priority / Token</th>
                <th>Patient & Demographics</th>
                <th>Facility Context</th>
                <th>Primary Symptom & Translation</th>
                <th>Vitals Summary</th>
                <th>Triage Level</th>
                <th>Status / Doctor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Loading prioritized clinical queue...
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No patient triage records matching current filters.
                  </td>
                </tr>
              ) : (
                queue.map(p => (
                  <tr key={p.id} className={`row-${p.triageLevel.toLowerCase()}`}>
                    {/* Token & Priority */}
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: 'white' }}>{p.id}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: p.colorTheme }}>
                        Score: {p.priorityScore} / 100
                      </div>
                    </td>

                    {/* Patient info */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'white' }}>{p.patientName}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {p.age}y • {p.gender} • Lang: {p.language.toUpperCase()}
                      </div>
                    </td>

                    {/* Facility */}
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{p.facilityName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{p.facilityType}</div>
                    </td>

                    {/* Symptom */}
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{
                        fontSize: '13px',
                        color: '#cbd5e1',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {p.structuredNote?.chiefComplaint || p.symptomText}
                      </div>
                    </td>

                    {/* Vitals Summary */}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {p.vitals?.spo2 && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: p.vitals.spo2 < 90 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                            color: p.vitals.spo2 < 90 ? '#f87171' : '#cbd5e1',
                            border: p.vitals.spo2 < 90 ? '1px solid #ef4444' : 'none'
                          }}>
                            SpO2: {p.vitals.spo2}%
                          </span>
                        )}
                        {p.vitals?.pulse && (
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(30, 41, 59, 0.8)', color: '#cbd5e1' }}>
                            HR: {p.vitals.pulse}
                          </span>
                        )}
                        {p.vitals?.systolicBP && (
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(30, 41, 59, 0.8)', color: '#cbd5e1' }}>
                            BP: {p.vitals.systolicBP}/{p.vitals.diastolicBP}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Triage Level Badge */}
                    <td>
                      <span className={`badge-${p.triageLevel.toLowerCase()}`}>
                        {p.triageLevel}
                      </span>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                        {p.targetResponseTime}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {p.status === 'DOCTOR_REVIEWED' ? (
                        <div>
                          <span style={{ color: '#34d399', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={14} /> Confirmed
                          </span>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>{p.reviewedBy || 'Doctor'}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>
                          ⏳ Pending Review
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => openPatientModal(p)}
                      >
                        <Edit3 size={14} />
                        Review Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HUMAN-IN-THE-LOOP PATIENT DOSSIER & OVERRIDE MODAL */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
              <div>
                <span className={`badge-${selectedPatient.triageLevel.toLowerCase()}`}>
                  {selectedPatient.triageLabel}
                </span>
                <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 800, marginTop: '6px' }}>
                  Clinical Dossier: {selectedPatient.id} - {selectedPatient.patientName}
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {selectedPatient.age} years old • {selectedPatient.gender} • Facility: {selectedPatient.facilityName}
                </p>
              </div>

              <button
                onClick={() => setSelectedPatient(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Responsive Auto-Fit Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Left Column: AI Clinical Summary & Evidence */}
              <div>
                <div className="glass-card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ff2948', marginBottom: '8px' }}>
                    PATIENT SYMPTOMS & VERNACULAR TRANSLATION
                  </h3>
                  <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.6 }}>
                    {selectedPatient.structuredNote?.chiefComplaint || selectedPatient.symptomText}
                  </p>
                </div>

                {selectedPatient.structuredNote?.clinicalRiskAlerts?.length > 0 && (
                  <div className="glass-card" style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                      🚨 CRITICAL RED FLAG ALERTS
                    </h3>
                    <ul style={{ paddingLeft: '16px', color: '#fca5a5', fontSize: '13px' }}>
                      {selectedPatient.structuredNote.clinicalRiskAlerts.map((alertText, idx) => (
                        <li key={idx}>{alertText}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="glass-card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                    RECORDED VITALS & MULTIMODAL FINDINGS
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '12px' }}>
                    <div>Pulse: <strong>{selectedPatient.vitals?.pulse || 'N/A'} bpm</strong></div>
                    <div>BP: <strong>{selectedPatient.vitals?.systolicBP ? `${selectedPatient.vitals.systolicBP}/${selectedPatient.vitals.diastolicBP}` : 'N/A'} mmHg</strong></div>
                    <div>SpO2: <strong>{selectedPatient.vitals?.spo2 || 'N/A'}%</strong></div>
                    <div>Temp: <strong>{selectedPatient.vitals?.temperature || 'N/A'}°F</strong></div>
                  </div>

                  {selectedPatient.imageInput && (
                    <div style={{ fontSize: '12px', color: '#cbd5e1', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px', marginTop: '8px' }}>
                      📷 <strong>Visual Input:</strong> {selectedPatient.imageInput.description}
                    </div>
                  )}

                  {selectedPatient.reportText && (
                    <div style={{ fontSize: '12px', color: '#cbd5e1', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px', marginTop: '8px' }}>
                      📄 <strong>Lab Report OCR:</strong> {selectedPatient.reportText}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Doctor Human-In-The-Loop Review & Override Controls */}
              <div className="glass-card" style={{ border: '1px solid #38bdf8' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={18} /> Human Clinical Review & Override
                </h3>

                <form onSubmit={handleReviewSubmit}>
                  <div className="form-group">
                    <label className="form-label">Urgency Level Override</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { lvl: 'RED', label: 'Level 1 (Red)' },
                        { lvl: 'YELLOW', label: 'Level 2 (Yellow)' },
                        { lvl: 'GREEN', label: 'Level 3 (Green)' },
                        { lvl: 'BLUE', label: 'Level 4 (Blue)' }
                      ].map(item => (
                        <button
                          key={item.lvl}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, triageLevel: item.lvl })}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: reviewForm.triageLevel === item.lvl ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.8)',
                            border: reviewForm.triageLevel === item.lvl ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: reviewForm.triageLevel === item.lvl ? '#38bdf8' : '#cbd5e1'
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assign Department / Specialist Ward</label>
                    <select
                      className="form-select"
                      value={reviewForm.suggestedDepartment}
                      onChange={e => setReviewForm({ ...reviewForm, suggestedDepartment: e.target.value })}
                    >
                      <option value="Emergency ER / ICU">Emergency ER / ICU</option>
                      <option value="Cardiology / Emergency Bay">Cardiology / Emergency Bay</option>
                      <option value="Pulmonology / Respiratory OPD">Pulmonology / Respiratory OPD</option>
                      <option value="Orthopedics & Trauma">Orthopedics & Trauma</option>
                      <option value="General Medicine OPD">General Medicine OPD</option>
                      <option value="Pediatric Emergency OPD">Pediatric Emergency OPD</option>
                      <option value="Dermatology / Wound Care">Dermatology / Wound Care</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Doctor Clinical Notes & Override Reason</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Add qualified clinical notes, medication instructions, or triage override rationale..."
                      value={reviewForm.doctorNotes}
                      onChange={e => setReviewForm({ ...reviewForm, doctorNotes: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reviewing Medical Officer</label>
                    <input
                      type="text"
                      className="form-input"
                      value={reviewForm.reviewedBy}
                      onChange={e => setReviewForm({ ...reviewForm, reviewedBy: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                    <Check size={16} /> Confirm Review & Route Patient
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
