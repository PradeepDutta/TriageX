'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useSyncExternalStore } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Droplets,
  HeartPulse,
  Home,
  LayoutDashboard,
  MapPin,
  Moon,
  ShieldCheck,
  Stethoscope,
  Sun,
  Thermometer,
} from 'lucide-react';

const navigation = [
  { href: '/patient-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/intake', label: 'AI Symptom Checker', icon: Activity },
  { href: '/intake', label: 'Triage', icon: Stethoscope },
  { href: '/services', label: 'Healthcare Services', icon: MapPin },
  { href: '/health-info', label: 'Health Information', icon: BookOpen },
];

const metrics = [
  { label: 'Heart rate', value: '72', unit: 'BPM', trend: 'Sample value', icon: HeartPulse, color: 'blue' },
  { label: 'Body temperature', value: '98.6', unit: '°F', trend: 'Sample value', icon: Thermometer, color: 'green' },
  { label: 'SpO₂', value: '98', unit: '%', trend: 'Sample value', icon: Droplets, color: 'purple' },
  { label: 'Daily movement', value: '7,240', unit: 'steps', trend: 'Sample value', icon: Activity, color: 'cyan' },
];

function subscribeToTheme(callback) {
  window.addEventListener('triagex-theme-change', callback);
  return () => window.removeEventListener('triagex-theme-change', callback);
}

function getThemeSnapshot() {
  return document.documentElement.dataset.theme === 'dark';
}

function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);

  useEffect(() => {
    let savedTheme = null;
    try {
      savedTheme = window.localStorage.getItem('triagex-theme');
    } catch (error) {
      console.error('Unable to read the saved TriageX theme preference:', error);
    }

    const dark = savedTheme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    window.dispatchEvent(new Event('triagex-theme-change'));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light';
    try {
      window.localStorage.setItem('triagex-theme', nextDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Unable to save the TriageX theme preference:', error);
    }
    window.dispatchEvent(new Event('triagex-theme-change'));
  };

  return (
    <button
      className="patient-theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function TrendChart() {
  return (
    <div className="patient-chart" role="img" aria-label="Illustrative sample health trends across one week">
      <div className="patient-chart-legend">
        <span><i className="patient-legend-heart" />Heart rate</span>
        <span><i className="patient-legend-temp" />Temperature</span>
        <span><i className="patient-legend-oxygen" />SpO₂</span>
      </div>
      <div className="patient-chart-plot">
        <div className="patient-chart-y-labels" aria-hidden="true"><span>100</span><span>80</span><span>60</span><span>40</span></div>
        <svg viewBox="0 0 640 210" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="patient-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2787ff" stopOpacity=".22" />
              <stop offset="100%" stopColor="#2787ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="patient-chart-gridline" d="M0 20H640 M0 75H640 M0 130H640 M0 185H640" />
          <path className="patient-chart-fill" d="M0 112 C42 103 50 61 96 66 S154 96 192 82 S254 37 288 55 S351 95 384 73 S449 50 480 78 S545 124 576 103 S616 72 640 82 V190 H0Z" />
          <path className="patient-chart-line patient-chart-line-blue" d="M0 112 C42 103 50 61 96 66 S154 96 192 82 S254 37 288 55 S351 95 384 73 S449 50 480 78 S545 124 576 103 S616 72 640 82" />
          <path className="patient-chart-line patient-chart-line-green" d="M0 145 C42 153 58 110 96 116 S151 147 192 137 S253 108 288 119 S349 151 384 137 S448 122 480 139 S542 158 576 145 S613 127 640 136" />
          <path className="patient-chart-line patient-chart-line-purple" d="M0 82 C40 93 58 126 96 121 S154 87 192 95 S250 128 288 113 S346 76 384 91 S447 121 480 106 S543 79 576 98 S613 120 640 110" />
        </svg>
        <div className="patient-chart-x-labels" aria-hidden="true"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      </div>
      <p className="patient-chart-note">Illustrative chart only — no personal health records are connected.</p>
    </div>
  );
}

export default function PatientDashboardPage() {
  return (
    <main className="patient-dashboard-shell">
      <aside className="patient-sidebar">
        <Link href="/" className="patient-brand" aria-label="TriageX home">
          <span className="patient-brand-mark">
            <Image src="/triagex-logo.png" alt="" width={43} height={43} />
          </span>
          <span><strong>TriageX</strong><small>Smart Triage. Better Care.</small></span>
        </Link>

        <nav className="patient-sidebar-nav" aria-label="Patient navigation">
          {navigation.map(({ href, label, icon: Icon }, index) => (
            <Link
              href={href}
              key={`${label}-${index}`}
              className={`patient-sidebar-link${index === 0 ? ' active' : ''}`}
              aria-current={index === 0 ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {index === 0 && <ChevronRight className="patient-sidebar-chevron" size={16} />}
            </Link>
          ))}
        </nav>

        <div className="patient-sidebar-promo">
          <div className="patient-promo-art" aria-hidden="true">
            <span className="patient-promo-orbit" />
            <ShieldCheck size={82} strokeWidth={1.4} />
            <HeartPulse className="patient-promo-heart" size={32} />
          </div>
          <strong>Your health, your pace.</strong>
          <p>Explore trusted care resources when you need them.</p>
          <Link href="/health-info">Browse health guides <ArrowRight size={14} /></Link>
        </div>

        <Link href="/" className="patient-back-home"><Home size={17} /> Back to TriageX home</Link>
      </aside>

      <div className="patient-dashboard-main">
        <header className="patient-topbar">
          <p><span>Patient preview</span><span aria-hidden="true">/</span><strong>Dashboard</strong></p>
          <div className="patient-topbar-actions">
            <span className="patient-demo-chip"><span /> Sample view</span>
            <ThemeToggle />
          </div>
        </header>

        <div className="patient-dashboard-content">
          <section className="patient-welcome-panel">
            <div className="patient-welcome-copy">
              <span className="patient-eyebrow"><ShieldCheck size={14} /> Your care, clearly organized</span>
              <h1>A clearer view of your <span>health.</span></h1>
              <p>Use TriageX to understand symptoms, explore care options, and find reliable health information.</p>
              <div className="patient-preview-notice"><CheckCircle2 size={17} /><span><strong>Dashboard preview</strong><small>Example data only. No patient account or personal records are connected.</small></span></div>
            </div>
            <div className="patient-welcome-art" aria-hidden="true">
              <div className="patient-art-glow" />
              <svg className="patient-ecg-art" viewBox="0 0 460 180" fill="none">
                <path d="M0 94h82l17-4 12-15 17 42 17-92 19 102 16-33h49l16-5 15-17 18 42 17-88 18 99 16-31h82" stroke="url(#patient-ecg-gradient)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <defs><linearGradient id="patient-ecg-gradient" x1="0" y1="90" x2="460" y2="90" gradientUnits="userSpaceOnUse"><stop stopColor="#5EAAFF" stopOpacity=".1" /><stop offset=".48" stopColor="#36C4D7" /><stop offset="1" stopColor="#21D49B" /></linearGradient></defs>
              </svg>
              <div className="patient-heart-illustration"><HeartPulse size={79} strokeWidth={1.45} /><span>+</span></div>
              <span className="patient-art-cross patient-art-cross-one">+</span>
              <span className="patient-art-cross patient-art-cross-two">+</span>
              <span className="patient-art-pulse"><Activity size={21} /></span>
            </div>
          </section>

          <section className="patient-metrics-section" aria-labelledby="patient-metrics-heading">
            <div className="patient-section-heading">
              <div><h2 id="patient-metrics-heading">Health snapshot</h2><p>Illustrative sample metrics</p></div>
              <span className="patient-sample-label">Sample data</span>
            </div>
            <div className="patient-metric-grid">
              {metrics.map(({ label, value, unit, trend, icon: Icon, color }) => (
                <article className="patient-metric-card" key={label}>
                  <span className={`patient-metric-icon ${color}`}><Icon size={24} /></span>
                  <div className="patient-metric-copy"><span>{label}</span><strong>{value}<small> {unit}</small></strong><em>{trend}</em></div>
                  <svg className="patient-sparkline" viewBox="0 0 90 40" aria-hidden="true"><path d="M2 32 C14 29 18 23 25 25 S36 12 44 17 S56 25 64 15 S78 20 88 4" /></svg>
                </article>
              ))}
            </div>
          </section>

          <div className="patient-dashboard-grid">
            <section className="patient-dashboard-card patient-trends-card" aria-labelledby="patient-trends-heading">
              <div className="patient-card-heading">
                <div><Activity size={20} /><div><h2 id="patient-trends-heading">Health trends</h2><p>Illustrative weekly overview</p></div></div>
                <span className="patient-card-badge">Demo chart</span>
              </div>
              <TrendChart />
            </section>

            <section className="patient-dashboard-card patient-care-card" aria-labelledby="patient-care-heading">
              <div className="patient-card-heading">
                <div><Stethoscope size={20} /><div><h2 id="patient-care-heading">Find your next step</h2><p>Choose a TriageX resource</p></div></div>
              </div>
              <div className="patient-care-links">
                <Link href="/intake"><span className="patient-care-icon blue"><Activity size={18} /></span><span><strong>Check your symptoms</strong><small>Start a guided symptom assessment</small></span><ChevronRight size={17} /></Link>
                <Link href="/services"><span className="patient-care-icon green"><MapPin size={18} /></span><span><strong>Explore healthcare services</strong><small>See care options supported by TriageX</small></span><ChevronRight size={17} /></Link>
                <Link href="/health-info"><span className="patient-care-icon purple"><BookOpen size={18} /></span><span><strong>Browse health information</strong><small>Read practical, reviewed guidance</small></span><ChevronRight size={17} /></Link>
              </div>
              <div className="patient-safety-note"><ShieldCheck size={18} /><p>TriageX is a decision-support tool, not a diagnosis. Seek emergency help for severe or rapidly worsening symptoms.</p></div>
            </section>

            <section className="patient-dashboard-card patient-activity-card" aria-labelledby="patient-activity-heading">
              <div className="patient-card-heading">
                <div><BookOpen size={20} /><div><h2 id="patient-activity-heading">Explore TriageX</h2><p>Tools available today</p></div></div>
              </div>
              <div className="patient-activity-list">
                <Link href="/intake"><span className="patient-activity-dot blue"><Activity size={15} /></span><span><strong>Guided symptom assessment</strong><small>Describe symptoms and get triage guidance</small></span><ArrowRight size={15} /></Link>
                <Link href="/health-info"><span className="patient-activity-dot green"><BookOpen size={15} /></span><span><strong>Health information library</strong><small>Explore general health topics</small></span><ArrowRight size={15} /></Link>
                <Link href="/services"><span className="patient-activity-dot purple"><MapPin size={15} /></span><span><strong>Healthcare services</strong><small>Learn about care pathways</small></span><ArrowRight size={15} /></Link>
              </div>
            </section>

            <section className="patient-dashboard-card patient-reminders-card" aria-labelledby="patient-reminders-heading">
              <div className="patient-card-heading">
                <div><ShieldCheck size={20} /><div><h2 id="patient-reminders-heading">About this preview</h2><p>What this dashboard can and cannot do</p></div></div>
              </div>
              <ul className="patient-preview-list">
                <li><CheckCircle2 size={16} /><span>All displayed health values and trends are examples.</span></li>
                <li><CheckCircle2 size={16} /><span>No account, personal health record, or device is connected.</span></li>
                <li><CheckCircle2 size={16} /><span>Assessment and information links open existing TriageX features.</span></li>
              </ul>
            </section>
          </div>

          <footer className="patient-dashboard-footer">
            <span>TriageX · Smart Triage. Better Care.</span>
            <Link href="/about">About this platform <ArrowRight size={14} /></Link>
          </footer>
        </div>
      </div>
    </main>
  );
}
