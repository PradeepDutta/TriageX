'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getTriageDisplay } from '../../lib/triage-display';
import {
  BarChart3, Activity, ShieldCheck, HeartPulse, Building,
  AlertTriangle, TrendingUp, Clock, Users, Download
} from 'lucide-react';

const FACILITY_SHORT_LABELS = {
  'PHC Rampur': 'PHC Rampur',
  'Camp Baramati - Rural Health Unit': 'Camp Baramati',
  'Jamshedpur Industrial Health Center': 'Industrial',
  'IIT Campus Health Center': 'IIT Campus',
  'District Hospital Pune': 'District Hosp.',
};

const FACILITY_COLORS = {
  'PHC Rampur': '#60a5fa',
  'Camp Baramati - Rural Health Unit': '#f97316',
  'Jamshedpur Industrial Health Center': '#14b8a6',
  'IIT Campus Health Center': '#10b981',
  'District Hospital Pune': '#eab308',
};

// ─── Inline SVG Charts (no external library needed) ───────────────────────

/** Simple bar chart rendered with SVG */
function BarChart({ data, height = 140, color = '#3b82f6' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      className="bar-chart"
      role="img"
      aria-label={`Bar chart: ${data.map((item) => `${item.label}, ${item.value}`).join('; ')}`}
      style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`, '--chart-height': `clamp(96px, 18vw, ${height}px)` }}
    >
      {data.map((d, i) => {
        const ratio = d.value / max;
        return (
          <div className="bar-chart-col" key={`${d.label}-${i}`} title={`${d.label}: ${d.value}`}>
            <div className="bar-chart-plot">
              <span className="bar-chart-value" style={{ top: `${Math.max(0, (1 - ratio) * 82 - 20)}%` }}>
                {d.value > 0 ? d.value : ''}
              </span>
              <div
                className="bar-chart-bar"
                style={{ height: `${Math.max(2, ratio * 82)}%`, background: d.color || color }}
              />
            </div>
            <span className="bar-chart-label">{d.shortLabel || d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Donut / Pie chart with SVG */
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = 40;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;

  const slices = segments.reduce((result, s) => {
    const fraction = s.value / total;
    const dash = fraction * circumference;
    const offset = result.length ? result[result.length - 1].offset + result[result.length - 1].dash : 0;
    result.push({ ...s, dash, offset });
    return result;
  }, []);

  return (
    <div className="donut-chart-wrapper">
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
            transform="rotate(-90 50 50)"
            opacity="0.85"
          >
            <title>{s.label}: {s.value} ({Math.round((s.value / total) * 100)}%)</title>
          </circle>
        ))}
        {/* Center total */}
        <text x="50" y="46" fontSize="12" fontWeight="800" fill="white" textAnchor="middle">{total}</text>
        <text x="50" y="56" fontSize="6" fill="#64748b" textAnchor="middle">TOTAL</text>
      </svg>

      <div className="donut-legend">
        {segments.map((s, i) => (
          <div key={i} className="donut-legend-item">
            <div className="donut-legend-dot" style={{ background: s.color }} />
            <div style={{ flex: 1 }}>
              <span style={{ color: '#dde4ef', fontWeight: 600 }}>{s.label}</span>
              <span style={{ color: '#64748b', marginLeft: '8px' }}>
                {s.value} ({Math.round((s.value / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Area / line sparkline chart */
function SparklineChart({ data, color = '#3b82f6', height = 80 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const w = 100;
  const h = height;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((d.value - min) / (max - min)) * h * 0.85 - h * 0.075,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pts[0].x},${h} ${polyline} ${pts[pts.length - 1].x},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', height: `${height}px` }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon points={area} fill={`url(#grad-${color.replace('#', '')})`} />
      {/* Line */}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.2" fill={color} vectorEffect="non-scaling-stroke">
          <title>{data[i].label}: {data[i].value}</title>
        </circle>
      ))}
    </svg>
  );
}

// ─── Generate sample historical trend data ─────────────────────────────────
function generateVolumeData() {
  const hours = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'];
  const base = [3, 7, 14, 18, 11, 8, 5, 2];
  return hours.map((label, i) => ({ label, shortLabel: label, value: base[i] }));
}

function generateResponseData() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = [4.2, 3.8, 5.1, 4.6, 3.9, 6.2, 4.8];
  return days.map((label, i) => ({ label, shortLabel: label, value: base[i] }));
}

// ─── Main Analytics Component ─────────────────────────────────────────────
export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [volumeData] = useState(generateVolumeData);
  const [responseData] = useState(generateResponseData);

  useEffect(() => {
    fetch('/api/triage/stats')
      .then((res) => res.json())
      .then((data) => { if (data.success) setStats(data.data); })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    setExportError('');
    try {
      const res = await fetch('/api/triage/queue');
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.error || 'Failed to fetch queue data');
      }

      const patients = data.data;
      if (patients.length === 0) {
        alert('No triage records found to export.');
        return;
      }

      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const headers = [
        'Record Type',
        'Patient ID',
        'Created At',
        'Name',
        'Age',
        'Gender',
        'Contact',
        'Facility Name',
        'Facility Type',
        'Language',
        'Triage Level',
        'Priority Score',
        'Emergency Override Active',
        'Emergency Override Reason',
        'Missing Vitals Flagged',
        'Pulse (bpm)',
        'Systolic BP (mmHg)',
        'Diastolic BP (mmHg)',
        'SpO2 (%)',
        'Temperature (F)',
        'Respiration Rate (/min)',
        'Chief Complaint / Symptoms',
        'Review Status',
        'Reviewed By',
        'Doctor Notes'
      ];

      const rows = patients.map((p) => [
        escapeCsv(p.isSimulated ? 'DEMO DATA (SYNTHETIC RECORD)' : 'LIVE CLINICAL INTAKE'),
        escapeCsv(p.id),
        escapeCsv(p.createdAt ? new Date(p.createdAt).toISOString() : ''),
        escapeCsv(p.patientName),
        escapeCsv(p.age),
        escapeCsv(p.gender),
        escapeCsv(p.contact),
        escapeCsv(p.facilityName),
        escapeCsv(p.facilityType),
        escapeCsv(p.language),
        escapeCsv(p.triageLevel),
        escapeCsv(p.priorityScore),
        escapeCsv(p.isEmergencyOverride ? 'YES' : 'NO'),
        escapeCsv(p.emergencyOverrideReason || 'N/A'),
        escapeCsv(p.structuredNote?.missingVitals?.length > 0 ? p.structuredNote.missingVitals.join('; ') : 'None'),
        escapeCsv(p.vitals?.pulse ?? 'N/A'),
        escapeCsv(p.vitals?.systolicBP ?? 'N/A'),
        escapeCsv(p.vitals?.diastolicBP ?? 'N/A'),
        escapeCsv(p.vitals?.spo2 ?? 'N/A'),
        escapeCsv(p.vitals?.temperature ?? 'N/A'),
        escapeCsv(p.vitals?.respirationRate ?? 'N/A'),
        escapeCsv(p.symptomText || ''),
        escapeCsv(p.status),
        escapeCsv(p.reviewedBy || ''),
        escapeCsv(p.doctorNotes || '')
      ]);

      const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.setAttribute('download', `triagex_facility_report_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
      setExportError(err.message || 'Export failed');
      alert(`CSV export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="page-container">
        {/* Page Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                <BarChart3 size={26} color="var(--blue-400)" />
                Facility Triage Analytics
              </h1>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)', fontWeight: 600 }}>
                DEMO / SIMULATED DATA LABELED
              </span>
            </div>
            <p className="page-subtitle" style={{ marginTop: '6px' }}>
              Real-time triage metric monitoring across PHCs, Public Camps, and District Hospitals.
            </p>
          </div>
          <button
            className="btn-ghost"
            style={{ fontSize: '13px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={handleExportCSV}
            disabled={exporting}
            id="export-csv-btn"
          >
            <Download size={14} /> {exporting ? 'Generating CSV…' : 'Export Real CSV'}
          </button>
        </div>

        {exportError && (
          <div style={{ padding: '10px 16px', background: 'rgba(232, 32, 58, 0.15)', border: '1px solid rgba(232, 32, 58, 0.4)', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', marginBottom: '18px' }}>
            CSV Export Error: {exportError}
          </div>
        )}

        {loading || !stats ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '72px', color: '#64748b' }}>
            <Activity size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
            Loading triage analytics…
          </div>
        ) : (
          <>
            {/* ── Top KPI Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                {
                  label: 'Total Triaged Intake',
                  value: stats.totalPatients,
                  desc: `Across ${stats.activeFacilities?.length || 5} active health units`,
                  icon: <Activity size={15} color="#60a5fa" />,
                  color: null,
                },
                {
                  label: 'Emergency Red Ratio',
                  value: `${Math.round((stats.redCount / (stats.totalPatients || 1)) * 100)}%`,
                  desc: `${stats.redCount} Level 1 Critical cases (${stats.pendingRedCount || 0} pending review)`,
                  icon: <AlertTriangle size={15} color="var(--red-500)" />,
                  color: 'var(--red-500)',
                },
                {
                  label: 'Clinical Review Alignment',
                  value: stats.clinicalAlignmentPct || '100%',
                  desc: stats.reviewedCount > 0
                    ? `Doctor confirmed (${stats.reviewedCount - (stats.overriddenCount || 0)}/${stats.reviewedCount})`
                    : 'Awaiting doctor reviews',
                  icon: <ShieldCheck size={15} color="#10b981" />,
                  color: '#10b981',
                },
                {
                  label: 'Mean Priority Score',
                  value: `${stats.avgPriority}`,
                  desc: 'Dynamic severity index / 100',
                  icon: <HeartPulse size={15} color="var(--yellow-500)" />,
                  color: 'var(--yellow-500)',
                },
                {
                  label: 'Avg Response Time',
                  value: stats.avgResponseTime || '4.5 min',
                  desc: 'Based on active pending wait times',
                  icon: <Clock size={15} color="#60a5fa" />,
                  color: '#60a5fa',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="stat-card"
                  style={card.color ? { borderLeft: `3px solid ${card.color}` } : {}}
                >
                  <div className="stat-card-label" style={card.color ? { color: card.color } : {}}>
                    {card.icon} {card.label}
                  </div>
                  <div className="stat-card-value" style={card.color ? { color: card.color } : {}}>
                    {card.value}
                  </div>
                  <div className="stat-card-desc">{card.desc}</div>
                </div>
              ))}
            </div>

            {/* ── Charts Row 1 ── */}
            <div className="analytics-chart-grid">
              {/* Patient Volume Over Time */}
              <div className="glass-panel analytics-chart-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 className="section-title">Patient Volume Today</h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>Intake per 2-hour window</p>
                  </div>
                  <TrendingUp size={18} color="var(--blue-400)" />
                </div>
                <BarChart data={volumeData} height={130} color="var(--blue-500)" />
              </div>

              {/* Triage Severity Distribution Donut */}
              <div className="glass-panel analytics-chart-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 className="section-title">Severity Distribution</h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>Triage level breakdown</p>
                  </div>
                  <BarChart3 size={18} color="var(--yellow-500)" />
                </div>
                <DonutChart
                  size={130}
                  segments={[
                    { label: getTriageDisplay('RED').name, value: stats.redCount, color: getTriageDisplay('RED').color },
                    { label: getTriageDisplay('YELLOW').name, value: stats.yellowCount, color: getTriageDisplay('YELLOW').color },
                    { label: getTriageDisplay('GREEN').name, value: stats.greenCount, color: getTriageDisplay('GREEN').color },
                    { label: getTriageDisplay('BLUE').name, value: stats.blueCount || 0, color: getTriageDisplay('BLUE').color },
                  ]}
                />
              </div>
            </div>

            {/* ── Charts Row 2 ── */}
            <div className="analytics-chart-grid">
              {/* Avg Response Time Sparkline */}
              <div className="glass-panel analytics-chart-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 className="section-title">Avg Response Time (min)</h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>7-day trend</p>
                  </div>
                  <Clock size={18} color="#60a5fa" />
                </div>
                <SparklineChart data={responseData} color="#60a5fa" height={90} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  {responseData.map((d) => (
                    <span key={d.label} style={{ fontSize: '10px', color: '#475569', textAlign: 'center', flex: 1 }}>{d.label}</span>
                  ))}
                </div>
              </div>

              {/* Urgency Level Bar Progress Chart */}
              <div className="glass-panel analytics-chart-panel">
                <div style={{ marginBottom: '20px' }}>
                  <h3 className="section-title">Triage Category Breakdown</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>Patient count by level</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: `${getTriageDisplay('RED').name} (Emergency)`, count: stats.redCount, color: getTriageDisplay('RED').color },
                    { label: `${getTriageDisplay('YELLOW').name} (Urgent)`, count: stats.yellowCount, color: getTriageDisplay('YELLOW').color },
                    { label: `${getTriageDisplay('GREEN').name} (Semi-urgent)`, count: stats.greenCount, color: getTriageDisplay('GREEN').color },
                    { label: `${getTriageDisplay('BLUE').name} (Routine)`, count: stats.blueCount || 0, color: getTriageDisplay('BLUE').color },
                  ].map((row) => {
                    const pct = stats.totalPatients ? Math.round((row.count / stats.totalPatients) * 100) : 0;
                    return (
                      <div key={row.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                          <span style={{ color: row.color, fontWeight: 700 }}>{row.label}</span>
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.count} &nbsp;({pct}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: row.color,
                              borderRadius: '4px',
                              transition: 'width 0.8s ease',
                              boxShadow: `0 0 8px ${row.color}55`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Facility Workload Chart ── */}
            <div style={{ marginBottom: '20px' }}>
              <div className="glass-panel analytics-chart-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 className="section-title">Facility Workload Distribution</h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>Current triage records by registered facility</p>
                  </div>
                  <Building size={18} color="#38bdf8" />
                </div>
                <BarChart
                  height={120}
                  color="#38bdf8"
                  data={(stats.facilityWorkload || []).map((facility) => ({
                    label: facility.facilityName,
                    shortLabel: FACILITY_SHORT_LABELS[facility.facilityName] || facility.facilityName,
                    value: facility.patientCount,
                    color: FACILITY_COLORS[facility.facilityName] || '#64748b',
                  }))}
                />
              </div>
            </div>

            {/* ── Active Facility Network ── */}
            <div className="glass-panel">
              <h3 className="section-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={18} color="var(--blue-400)" /> Active Health Facility Network
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
                {(stats.facilityWorkload || []).map((facility) => {
                  const patientCount = facility.patientCount;
                  const color = FACILITY_COLORS[facility.facilityName] || '#64748b';
                  return (
                    <div
                      key={facility.facilityName}
                      className="glass-card"
                      style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `3px solid ${color}` }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>{facility.facilityName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {patientCount} {patientCount === 1 ? 'patient' : 'patients'} in queue
                        </div>
                        {/* Tiny workload bar */}
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${(patientCount / (stats.totalPatients || 1)) * 100}%`, height: '100%', background: color, borderRadius: '2px' }} />
                        </div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        ONLINE
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
