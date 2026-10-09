'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '../components/Navbar';
import { getTriageDisplay } from '../../lib/triage-display';
import {
  Stethoscope, Search, ShieldCheck, Edit3, Plus, Check, RefreshCw,
  ChevronLeft, ChevronRight, AlertTriangle, Clock, Users, Activity,
  ArrowUpDown, ChevronUp, ChevronDown, X
} from 'lucide-react';

const PAGE_SIZE = 8;
const LEVEL_ORDER = { RED: 0, YELLOW: 1, GREEN: 2, BLUE: 3 };

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
  return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

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

  // Sort
  const [sortField, setSortField] = useState('priorityScore');
  const [sortDir, setSortDir] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const reviewDialogRef = useRef(null);
  const [reviewForm, setReviewForm] = useState({
    triageLevel: '',
    suggestedDepartment: '',
    doctorNotes: '',
    reviewedBy: 'Dr. S. Kulkarni (Medical Officer)',
  });

  const getReviewDialogFocusTargets = () => Array.from(reviewDialogRef.current?.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ) || []);

  const handleReviewDialogKeyDown = (event) => {
    if (event.key === 'Escape') {
      setSelectedPatient(null);
      return;
    }

    if (event.key !== 'Tab') return;
    const dialog = reviewDialogRef.current;
    const focusableElements = getReviewDialogFocusTargets();
    if (!dialog || focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && (document.activeElement === firstElement || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && (document.activeElement === lastElement || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  useEffect(() => {
    if (!selectedPatient) return;

    const previousFocus = document.activeElement;
    getReviewDialogFocusTargets()[0]?.focus();
    return () => {
      previousFocus?.focus();
    };
  }, [selectedPatient]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const url = `/api/triage/queue?facilityType=${facilityFilter}&triageLevel=${levelFilter}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`;
      const [queueRes, statsRes] = await Promise.all([fetch(url), fetch('/api/triage/stats')]);
      const [queueData, statsData] = await Promise.all([queueRes.json(), statsRes.json()]);
      if (queueData.success) setQueue(queueData.data);
      if (statsData.success) setStats(statsData.data);
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
        const [queueRes, statsRes] = await Promise.all([fetch(url), fetch('/api/triage/stats')]);
        const [queueData, statsData] = await Promise.all([queueRes.json(), statsRes.json()]);
        if (active && queueData.success) setQueue(queueData.data);
        if (active && statsData.success) setStats(statsData.data);
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
      if (data.success) loadDashboardData();
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
      reviewedBy: patient.reviewedBy || 'Dr. S. Kulkarni (Medical Officer)',
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const res = await fetch(`/api/triage/review/${selectedPatient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reviewForm, status: 'DOCTOR_REVIEWED' }),
      });
      const data = await res.json();
      if (data.success) { setSelectedPatient(null); loadDashboardData(); }
      else alert(data.error || 'Review submission failed');
    } catch (err) {
      console.error(err);
      alert('Error updating patient review.');
    }
  };

  const toggleSort = (field) => {
    setCurrentPage(1);
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortedQueue = useMemo(() => {
    return [...queue].sort((a, b) => {
      let av, bv;
      if (sortField === 'triageLevel') {
        av = LEVEL_ORDER[a.triageLevel] ?? 9;
        bv = LEVEL_ORDER[b.triageLevel] ?? 9;
      } else if (sortField === 'priorityScore') {
        av = a.priorityScore ?? 0;
        bv = b.priorityScore ?? 0;
      } else if (sortField === 'patientName') {
        av = a.patientName?.toLowerCase() ?? '';
        bv = b.patientName?.toLowerCase() ?? '';
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      } else {
        av = a[sortField] ?? '';
        bv = b[sortField] ?? '';
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [queue, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedQueue.length / PAGE_SIZE));
  const paginatedQueue = sortedQueue.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <Navbar />

      <div className="page-container">
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 className="page-title">
              <Stethoscope size={26} color="var(--blue-400)" />
              Clinician Triage Command Center
            </h1>
            <p className="page-subtitle">
              Human-in-the-loop priority queue management &amp; clinical dossier review.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button className="btn-secondary" onClick={handleSimulateIntake} disabled={simulating} style={{ fontSize: '14px', padding: '10px 18px' }}>
              {simulating ? <RefreshCw className="spin" size={15} /> : <Plus size={15} />}
              Simulate Intake
            </button>
            <button className="btn-primary" onClick={loadDashboardData} style={{ fontSize: '14px', padding: '10px 18px' }}>
              <RefreshCw size={15} /> Refresh Queue
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {[
              { label: 'Active Queue', value: stats.totalPatients, desc: 'Across all facilities', icon: <Users size={15} color="var(--blue-400)" />, accent: null },
              { label: 'Level 1 · RED', value: stats.redCount, desc: 'Immediate response', icon: <AlertTriangle size={15} color="var(--red-500)" />, accent: 'var(--red-500)' },
              { label: 'Level 2 · ORANGE', value: stats.yellowCount, desc: 'Urgent medical review', icon: <Clock size={15} color="var(--orange-500)" />, accent: 'var(--orange-500)' },
              { label: 'Level 3 · YELLOW', value: stats.greenCount, desc: 'Semi-urgent care', icon: <Activity size={15} color="var(--yellow-500)" />, accent: 'var(--yellow-500)' },
              { label: 'Level 4 · GREEN', value: stats.blueCount, desc: 'Routine consultation', icon: <Activity size={15} color="var(--green-500)" />, accent: 'var(--green-500)' },
              { label: 'Pending Review', value: stats.pendingCount, desc: 'Awaiting Doctor Signal', icon: <ShieldCheck size={15} color="var(--blue-400)" />, accent: 'var(--blue-500)' },
            ].map((card) => (
              <div
                key={card.label}
                className="stat-card"
                style={card.accent ? { borderLeft: `3px solid ${card.accent}` } : {}}
              >
                <div className="stat-card-label" style={card.accent ? { color: card.accent } : {}}>
                  {card.icon} {card.label}
                </div>
                <div className="stat-card-value" style={card.accent ? { color: card.accent } : {}}>
                  {card.value}
                </div>
                <div className="stat-card-desc">{card.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Bar */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '14px' }}
                aria-label="Search patients by name, ID, or symptoms"
                placeholder="Search patient, ID, symptoms…"
                value={searchQuery}
                onChange={(e) => { setCurrentPage(1); setSearchQuery(e.target.value); }}
              />
            </div>

            <select className="form-select" style={{ fontSize: '14px' }} value={levelFilter} onChange={(e) => { setCurrentPage(1); setLevelFilter(e.target.value); }} aria-label="Filter by triage level">
              <option value="ALL">All Triage Levels</option>
              <option value="RED">Level 1 — RED (Emergency)</option>
              <option value="YELLOW">Level 2 — ORANGE (Urgent)</option>
              <option value="GREEN">Level 3 — YELLOW (Semi-Urgent)</option>
              <option value="BLUE">Level 4 — GREEN (Routine)</option>
            </select>

            <select className="form-select" style={{ fontSize: '14px' }} value={statusFilter} onChange={(e) => { setCurrentPage(1); setStatusFilter(e.target.value); }} aria-label="Filter by review status">
              <option value="ALL">All Statuses</option>
              <option value="PENDING_DOCTOR_APPROVAL">Pending Doctor Review</option>
              <option value="DOCTOR_REVIEWED">Doctor Reviewed</option>
            </select>

            <select className="form-select" style={{ fontSize: '14px' }} value={facilityFilter} onChange={(e) => { setCurrentPage(1); setFacilityFilter(e.target.value); }} aria-label="Filter by facility">
              <option value="ALL">All Facilities</option>
              <option value="Primary Health Center (PHC)">PHCs</option>
              <option value="Public Health Camp">Public Health Camps</option>
              <option value="Government Hospital">Government Hospitals</option>
              <option value="Industrial Clinic">Industrial Clinics</option>
              <option value="Campus Health Center">Campus Clinics</option>
            </select>
          </div>
        </div>

        {/* Critical Patient Visibility Alert: never silently hide emergency cases */}
        {(() => {
          const visiblePendingRed = queue.filter(p => p.triageLevel === 'RED' && p.status === 'PENDING_DOCTOR_APPROVAL').length;
          const hiddenPendingRed = Math.max(0, (stats?.pendingRedCount || 0) - visiblePendingRed);
          if (hiddenPendingRed <= 0) return null;
          return (
            <div style={{
              background: 'rgba(232, 32, 58, 0.16)',
              border: '1px solid rgba(232, 32, 58, 0.55)',
              borderRadius: '10px',
              padding: '12px 18px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', fontWeight: 700, fontSize: '13px' }}>
                <AlertTriangle size={18} color="var(--red-400)" style={{ flexShrink: 0 }} />
                <span>
                  CRITICAL ALERT: {hiddenPendingRed} Level 1 (RED) Emergency {hiddenPendingRed === 1 ? 'patient is' : 'patients are'} filtered out by current view settings.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-primary btn-critical"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => {
                    setLevelFilter('RED');
                    setStatusFilter('ALL');
                    setFacilityFilter('ALL');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  View Emergency Patients
                </button>
                <button
                  className="btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => {
                    setLevelFilter('ALL');
                    setStatusFilter('ALL');
                    setFacilityFilter('ALL');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          );
        })()}

        {/* Patient Queue Table */}
        <div className="glass-panel responsive-table-wrapper" style={{ padding: 0 }}>
          <table className="triage-table">
            <thead>
              <tr>
                <th scope="col" aria-sort={sortField === 'priorityScore' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" onClick={() => toggleSort('priorityScore')} aria-label={`Sort by priority ${sortField === 'priorityScore' ? sortDir === 'asc' ? 'descending' : 'ascending' : 'descending'}`}>
                    Priority <SortIcon field="priorityScore" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th scope="col" aria-sort={sortField === 'patientName' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" onClick={() => toggleSort('patientName')} aria-label={`Sort by patient name ${sortField === 'patientName' ? sortDir === 'asc' ? 'descending' : 'ascending' : 'descending'}`}>
                    Patient <SortIcon field="patientName" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th scope="col">Facility</th>
                <th scope="col">Chief Complaint</th>
                <th scope="col">Vitals</th>
                <th scope="col" aria-sort={sortField === 'triageLevel' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" onClick={() => toggleSort('triageLevel')} aria-label={`Sort by triage level ${sortField === 'triageLevel' ? sortDir === 'asc' ? 'descending' : 'ascending' : 'descending'}`}>
                    Level <SortIcon field="triageLevel" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                    <RefreshCw className="spin" size={20} style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                    Loading prioritized clinical queue…
                  </td>
                </tr>
              ) : paginatedQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                    <Users size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: '15px', color: '#dde4ef', fontWeight: 600 }}>No patient triage records matching current filters.</div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: '12px', padding: '6px 14px' }}
                        onClick={() => {
                          setLevelFilter('ALL');
                          setStatusFilter('ALL');
                          setFacilityFilter('ALL');
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                      >
                        Reset All Filters
                      </button>
                      <button
                        className="btn-primary"
                        style={{ fontSize: '12px', padding: '6px 14px' }}
                        onClick={handleSimulateIntake}
                        disabled={simulating}
                      >
                        + Simulate Patient Intake
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedQueue.map((p) => {
                  const display = getTriageDisplay(p.triageLevel);
                  const color = display.color;
                  const isCritical = p.triageLevel?.toUpperCase() === 'RED';
                  return (
                    <tr key={p.id} className={`row-${display.className}`}>
                      {/* Token & Priority */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isCritical && (
                            <AlertTriangle size={14} color="var(--red-500)" style={{ flexShrink: 0 }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: 'white', letterSpacing: '0' }}>{p.id}</div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>{p.priorityScore}/100</span>
                              {p.isEmergencyOverride && (
                                <span
                                  className="badge badge-red"
                                  style={{ fontSize: '9px', padding: '1px 5px', fontWeight: 800 }}
                                  title={p.emergencyOverrideReason || 'High-risk red flag overrides stable baseline vitals'}
                                >
                                  Override
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Patient info */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{p.patientName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {p.age}y · {p.gender} · {p.language?.toUpperCase()}
                        </div>
                      </td>

                      {/* Facility */}
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{p.facilityName}</div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{p.facilityType}</div>
                      </td>

                      {/* Symptom */}
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{
                          fontSize: '13px', color: '#94a3b8',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          lineHeight: 1.4,
                        }}>
                          {p.structuredNote?.chiefComplaint || p.symptomText}
                        </div>
                      </td>

                      {/* Vitals */}
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {p.vitals?.spo2 && (
                            <span style={{
                              fontSize: '11px', fontWeight: 700, padding: '3px 7px',
                              borderRadius: '4px',
                              background: Number(p.vitals.spo2) < 90 ? 'rgba(232, 32, 58, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                              color: Number(p.vitals.spo2) < 90 ? '#f04457' : '#94a3b8',
                              border: Number(p.vitals.spo2) < 90 ? '1px solid rgba(232, 32, 58, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                            }}>
                              SpO₂ {p.vitals.spo2}%
                            </span>
                          )}
                          {p.vitals?.pulse && (
                            <span style={{ fontSize: '11px', padding: '3px 7px', borderRadius: '4px', background: 'rgba(30, 41, 59, 0.8)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}>
                              HR {p.vitals.pulse}
                            </span>
                          )}
                          {p.vitals?.systolicBP && (
                            <span style={{ fontSize: '11px', padding: '3px 7px', borderRadius: '4px', background: 'rgba(30, 41, 59, 0.8)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}>
                              BP {p.vitals.systolicBP}/{p.vitals.diastolicBP}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Triage Level Badge */}
                      <td>
                        <span className={`badge badge-${display.className}`}>
                          {display.name}
                        </span>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                          {p.targetResponseTime}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {p.status === 'DOCTOR_REVIEWED' ? (
                          <div>
                            <span style={{ color: '#34d399', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={13} /> Confirmed
                            </span>
                            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{p.reviewedBy || 'Doctor'}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--yellow-400)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          className={isCritical ? 'btn-primary btn-critical' : 'btn-ghost'}
                          style={{ padding: '7px 12px', fontSize: '12px', gap: '5px' }}
                          onClick={() => openPatientModal(p)}
                        >
                          <Edit3 size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!loading && sortedQueue.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, sortedQueue.length)} of {sortedQueue.length} patients
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="First page"
                >
                  «
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={14} />
                </button>

                {/* Page number buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '…' ? (
                      <span key={`ellipsis-${idx}`} style={{ color: '#475569', fontSize: '13px', padding: '0 4px' }}>…</span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last page"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PATIENT DOSSIER & OVERRIDE MODAL */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div
            ref={reviewDialogRef}
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-review-title"
            tabIndex={-1}
            onKeyDown={handleReviewDialogKeyDown}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
              <div>
                <span className={`badge badge-${getTriageDisplay(selectedPatient.triageLevel).className}`}>
                  {getTriageDisplay(selectedPatient.triageLevel).name}
                </span>
                <h2 id="patient-review-title" style={{ fontSize: '21px', fontWeight: 800, marginTop: '8px', letterSpacing: '0', overflowWrap: 'anywhere' }}>
                  Clinical Dossier: {selectedPatient.id} — {selectedPatient.patientName}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {selectedPatient.age}y · {selectedPatient.gender} · {selectedPatient.facilityName}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="modal-close-btn"
                aria-label="Close patient review"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="glass-card">
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--blue-400)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0' }}>
                    Patient Symptoms
                  </h3>
                  <p style={{ fontSize: '13px', color: '#dde4ef', lineHeight: 1.65 }}>
                    {selectedPatient.structuredNote?.chiefComplaint || selectedPatient.symptomText}
                  </p>
                </div>

                {selectedPatient.isEmergencyOverride && (
                  <div className="glass-card" style={{ border: '1px solid rgba(232,32,58,0.45)', background: 'rgba(232,32,58,0.1)' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red-400)', marginBottom: '4px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} /> Clinical Emergency Override
                    </h3>
                    <p style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.5 }}>
                      {selectedPatient.emergencyOverrideReason}
                    </p>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
                      Baseline Vital / Symptom Score: <strong>{selectedPatient.numericalScore || selectedPatient.priorityScore}/100</strong>
                    </div>
                  </div>
                )}

                {selectedPatient.structuredNote?.clinicalRiskAlerts?.length > 0 && (
                  <div className="glass-card" style={{ border: '1px solid rgba(232,32,58,0.35)', background: 'rgba(232,32,58,0.07)' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red-400)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} /> Critical Red Flag Alerts
                    </h3>
                    <ul style={{ paddingLeft: '16px', color: '#fca5a5', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedPatient.structuredNote.clinicalRiskAlerts.map((alertText, idx) => (
                        <li key={idx}>{alertText}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="glass-card">
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--blue-400)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0' }}>
                    Recorded Vitals
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    <div>Pulse: <strong>{selectedPatient.vitals?.pulse || 'N/A'} bpm</strong></div>
                    <div>SpO₂: <strong>{selectedPatient.vitals?.spo2 || 'N/A'}%</strong></div>
                    <div>BP: <strong>{selectedPatient.vitals?.systolicBP ? `${selectedPatient.vitals.systolicBP}/${selectedPatient.vitals.diastolicBP}` : 'N/A'}</strong></div>
                    <div>Temp: <strong>{selectedPatient.vitals?.temperature || 'N/A'}°F</strong></div>
                    <div>RR: <strong>{selectedPatient.vitals?.respirationRate || 'N/A'}/min</strong></div>
                  </div>
                  {selectedPatient.imageInput && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '10px' }}>
                      📷 <strong>Visual:</strong> {selectedPatient.imageInput.description}
                    </div>
                  )}
                  {selectedPatient.reportText && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '8px' }}>
                      📄 <strong>Lab OCR:</strong> {selectedPatient.reportText}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Doctor Review */}
              <div className="glass-card" style={{ border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--blue-400)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={17} /> Human Clinical Review &amp; Override
                </h3>

                <form onSubmit={handleReviewSubmit}>
                  <div className="form-group">
                    <label className="form-label" id="review-level-label">Urgency Level Override</label>
                    <div role="group" aria-labelledby="review-level-label" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { lvl: 'RED', label: 'Level 1 (Red)', color: 'var(--red-500)' },
                        { lvl: 'YELLOW', label: 'Level 2 (Orange)', color: 'var(--orange-500)' },
                        { lvl: 'GREEN', label: 'Level 3 (Yellow)', color: 'var(--yellow-500)' },
                        { lvl: 'BLUE', label: 'Level 4 (Green)', color: 'var(--green-500)' },
                      ].map((item) => (
                        <button
                          key={item.lvl}
                          type="button"
                          aria-pressed={reviewForm.triageLevel === item.lvl}
                          onClick={() => setReviewForm({ ...reviewForm, triageLevel: item.lvl })}
                          style={{
                            padding: '9px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: reviewForm.triageLevel === item.lvl ? `${item.color}22` : 'rgba(15, 23, 42, 0.8)',
                            border: reviewForm.triageLevel === item.lvl ? `1px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                            color: reviewForm.triageLevel === item.lvl ? item.color : '#94a3b8',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="review-department">Assign Department</label>
                    <select
                      className="form-select"
                      id="review-department"
                      value={reviewForm.suggestedDepartment}
                      onChange={(e) => setReviewForm({ ...reviewForm, suggestedDepartment: e.target.value })}
                    >
                      <option>Emergency ER / ICU</option>
                      <option>Cardiology / Emergency Bay</option>
                      <option>Pulmonology / Respiratory OPD</option>
                      <option>Orthopedics &amp; Trauma</option>
                      <option>General Medicine OPD</option>
                      <option>Pediatric Emergency OPD</option>
                      <option>Dermatology / Wound Care</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="review-notes">Doctor Clinical Notes</label>
                    <textarea
                      id="review-notes"
                      className="form-textarea"
                      rows={3}
                      placeholder="Add clinical notes, medication instructions, or override rationale…"
                      value={reviewForm.doctorNotes}
                      onChange={(e) => setReviewForm({ ...reviewForm, doctorNotes: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reviewed-by">Reviewing Medical Officer</label>
                    <input
                      type="text"
                      className="form-input"
                      id="reviewed-by"
                      value={reviewForm.reviewedBy}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewedBy: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                    <Check size={16} /> Confirm Review &amp; Route Patient
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
