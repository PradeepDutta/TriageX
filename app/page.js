"use client";

import CyberHeart3D from "./components/CyberHeart3D";
import Link from "next/link";
import Navbar from "./components/Navbar";
import {
  UserPlus,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Activity,
  Mic,
  Brain,
  Users,
  AlertTriangle,
  Globe,
  Eye,
  Heart,
  ChevronRight,
  CheckCircle,
  Clock,
  BarChart3,
  Zap,
} from "lucide-react";

// ─── Landing Page Sections ───────────────────────────────────────────────────

function HeroSection() {
  return (
    <main className="hero" aria-label="TriageX Hero">
      {/* Cybernetic 3D Background */}
      <div className="spline-wrapper">
        <CyberHeart3D />
      </div>

      {/* Dark overlay */}
      <div className="hero-overlay" />

      {/* Left Hero Content */}
      <section className="hero-content">
        {/* Eyebrow */}
        <div className="hero-eyebrow" aria-label="Product category">
          <span className="hero-eyebrow-dot" />
          AI-ASSISTED HEALTHCARE TRIAGE
        </div>

        <h1>
          Smarter Triage.<br />
          Faster Decisions.<br />
          <span>Better Care.</span>
        </h1>

        <p className="hero-body">
          TriageX combines patient symptoms, vital signs, multilingual voice
          interaction, and explainable AI-assisted assessment to help healthcare
          teams prioritize patients efficiently.
        </p>

        {/* CTAs */}
        <div className="hero-actions">
          <Link href="/intake" className="btn-primary" style={{ fontSize: "15px", padding: "15px 30px" }}>
            <UserPlus size={18} />
            Start Patient Assessment
            <ArrowRight size={16} />
          </Link>

          <Link href="/#how-it-works" className="btn-secondary">
            See How It Works
          </Link>
        </div>

        {/* Feature Labels */}
        <div className="hero-feature-labels" aria-label="Key features">
          <span className="hero-feature-label">
            <Brain size={12} />
            AI-Assisted Triage
          </span>
          <span className="hero-feature-label">
            <Mic size={12} />
            Multilingual Voice
          </span>
          <span className="hero-feature-label">
            <Eye size={12} />
            Explainable Results
          </span>
          <span className="hero-feature-label">
            <Users size={12} />
            Human-in-the-Loop
          </span>
        </div>

        {/* Safety note */}
        <div className="hero-safety-note">
          <ShieldCheck size={13} color="#10b981" />
          <span>AI-assisted · Human-reviewed · Not a standalone diagnostic system</span>
        </div>
      </section>

      {/* Right: Product Preview Cards */}
      <section className="hero-cards-wrapper" aria-label="Product preview">
        {/* Card: Patient */}
        <div className="hero-triage-card">
          <div className="htc-header">
            <span className="htc-label">PATIENT ASSESSMENT</span>
            <span className="htc-badge badge-blue">Active</span>
          </div>
          <div className="htc-patient">Ramesh V. · 54y · Male</div>
          <div className="htc-sub">
            <span className="htc-icon-wrap blue"><Activity size={11} /></span>
            4 symptoms reported · Hindi
          </div>
        </div>

        {/* Card: AI Result — most prominent */}
        <div className="hero-triage-card htc-alert">
          <div className="htc-header">
            <span className="htc-label" style={{ color: "var(--red-400)" }}>AI TRIAGE RESULT</span>
            <span className="badge badge-red">EMERGENCY</span>
          </div>
          <div className="htc-result-main">
            <span className="htc-result-text">Immediate Review</span>
          </div>
          <div className="htc-result-sub">
            <Clock size={11} color="var(--yellow-400)" />
            Awaiting clinician confirmation
          </div>
        </div>

        {/* Card: Vitals */}
        <div className="hero-triage-card">
          <div className="htc-header">
            <span className="htc-label">VITAL SIGNS</span>
            <span style={{ fontSize: "11px", color: "var(--red-400)", fontWeight: 700 }}>2 Critical</span>
          </div>
          <div className="htc-vitals-row">
            <div className="htc-vital">
              <span>SpO₂</span>
              <strong style={{ color: "var(--red-400)" }}>88%</strong>
            </div>
            <div className="htc-vital">
              <span>HR</span>
              <strong style={{ color: "var(--red-400)" }}>124 bpm</strong>
            </div>
            <div className="htc-vital">
              <span>BP</span>
              <strong>178/106</strong>
            </div>
            <div className="htc-vital">
              <span>Temp</span>
              <strong>98.6°F</strong>
            </div>
          </div>
          <div className="htc-sub" style={{ marginTop: "8px" }}>
            <span className="htc-icon-wrap red"><AlertTriangle size={10} /></span>
            Critical hypoxia · Tachycardia detected
          </div>
        </div>
      </section>
    </main>
  );
}

function ProblemSection() {
  return (
    <section className="lp-section problem-section" aria-labelledby="problem-title">
      <div className="lp-container">
        <header className="lp-section-header">
          <span className="lp-eyebrow">THE CHALLENGE</span>
          <h2 id="problem-title" className="lp-heading">
            Healthcare triage shouldn&apos;t begin with uncertainty.
          </h2>
        </header>

        <div className="problem-cards">
          <div className="problem-card">
            <div className="problem-num">01</div>
            <h3 className="problem-card-title">Delayed prioritization</h3>
            <p className="problem-card-body">
              Help organize patient information before clinical review, reducing
              the time between arrival and initial assessment.
            </p>
          </div>
          <div className="problem-card">
            <div className="problem-num">02</div>
            <h3 className="problem-card-title">Communication barriers</h3>
            <p className="problem-card-body">
              Patients may struggle to communicate symptoms clearly or in
              English. Language should never be an obstacle to care.
            </p>
          </div>
          <div className="problem-card">
            <div className="problem-num">03</div>
            <h3 className="problem-card-title">Scattered information</h3>
            <p className="problem-card-body">
              Symptoms and vital signs need to be considered together for a
              complete clinical picture — not reviewed in isolation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const features = [
    {
      icon: <Brain size={20} />,
      title: "AI-Assisted Triage",
      body: "Analyze configured patient information and identify urgency level using structured clinical rules and risk indicators.",
      color: "blue",
    },
    {
      icon: <Mic size={20} />,
      title: "Multilingual Voice",
      body: "Allow patients to describe symptoms naturally using supported Indian languages. No language barrier to triage.",
      color: "green",
    },
    {
      icon: <Eye size={20} />,
      title: "Explainable Assessment",
      body: "Show the specific symptoms, vital signs, and risk factors that contributed to the triage result.",
      color: "blue",
    },
    {
      icon: <Users size={20} />,
      title: "Human-in-the-Loop",
      body: "Keep clinicians involved and in control of the final decision. AI provides support, not replacement.",
      color: "green",
    },
  ];

  return (
    <section className="lp-section solution-section" aria-labelledby="solution-title">
      <div className="lp-container">
        <header className="lp-section-header">
          <span className="lp-eyebrow">THE SOLUTION</span>
          <h2 id="solution-title" className="lp-heading">
            Meet TriageX
          </h2>
          <p className="lp-subheading">
            TriageX brings patient information, symptoms, vital signs,
            AI-assisted assessment, multilingual interaction, and clinician
            review into one streamlined workflow.
          </p>
        </header>

        <div className="solution-cards">
          {features.map((f) => (
            <div key={f.title} className={`solution-card solution-card-${f.color}`}>
              <div className={`solution-icon solution-icon-${f.color}`}>
                {f.icon}
              </div>
              <h3 className="solution-card-title">{f.title}</h3>
              <p className="solution-card-body">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: <UserPlus size={22} />,
      title: "Patient Information",
      body: "Collect basic patient demographics — name, age, gender, language preference, and facility.",
    },
    {
      num: "02",
      icon: <Activity size={22} />,
      title: "Vital Signs",
      body: "Capture Heart Rate, SpO₂, Blood Pressure, Temperature, and Respiratory Rate. Critical values are flagged automatically.",
    },
    {
      num: "03",
      icon: <Mic size={22} />,
      title: "Symptoms",
      body: "Patient enters symptoms using text or voice in any supported language. Speech is transcribed and translated for clinical review.",
    },
    {
      num: "04",
      icon: <Brain size={22} />,
      title: "AI Analysis",
      body: "The system analyzes all provided information using configured clinical rules, multilingual keyword matching, and risk indicators.",
    },
    {
      num: "05",
      icon: <Zap size={22} />,
      title: "Triage Classification",
      body: "Generates one of three classifications — ROUTINE, URGENT, or EMERGENCY — with a priority score and target response time.",
    },
    {
      num: "06",
      icon: <ShieldCheck size={22} />,
      title: "Clinician Review",
      body: "Clinicians review contributing factors, accept or modify the assessment, and add clinical notes before finalizing.",
    },
  ];

  return (
    <section id="how-it-works" className="lp-section how-it-works-section" aria-labelledby="how-title">
      <div className="lp-container">
        <header className="lp-section-header">
          <span className="lp-eyebrow">THE WORKFLOW</span>
          <h2 id="how-title" className="lp-heading">
            How TriageX Works
          </h2>
          <p className="lp-subheading">
            A structured, six-step workflow from patient arrival to clinician-confirmed triage decision.
          </p>
        </header>

        <div className="how-steps">
          {steps.map((step, idx) => (
            <div key={step.num} className="how-step">
              <div className="how-step-num">{step.num}</div>
              <div className="how-step-icon">{step.icon}</div>
              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-body">{step.body}</p>
              {idx < steps.length - 1 && <div className="how-step-connector" aria-hidden="true" />}
            </div>
          ))}
        </div>

        <div className="how-cta">
          <Link href="/intake" className="btn-primary" style={{ display: "inline-flex" }}>
            <UserPlus size={18} />
            Try the Assessment Flow
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function VoiceSection() {
  return (
    <section className="lp-section voice-section" aria-labelledby="voice-title">
      <div className="lp-container voice-container">
        {/* Left: Copy */}
        <div className="voice-copy">
          <span className="lp-eyebrow">MULTILINGUAL VOICE</span>
          <h2 id="voice-title" className="lp-heading" style={{ textAlign: "left" }}>
            Speak in your language.
          </h2>
          <p className="lp-subheading" style={{ textAlign: "left" }}>
            Describe symptoms naturally using your voice. TriageX supports
            multiple Indian languages with browser-based speech recognition and
            automatic translation for clinical review.
          </p>

          <div className="voice-languages">
            {["English", "Hindi", "Odia", "Bengali", "Telugu", "Tamil", "Marathi", "Gujarati", "Punjabi", "Kannada", "Malayalam", "Assamese", "Urdu"].map((lang) => (
              <span key={lang} className="voice-lang-chip">{lang}</span>
            ))}
          </div>

          <div className="voice-flow-inline">
            {[
              "Patient Speech",
              "Speech Recognition",
              "Original Transcript",
              "Translation (if needed)",
              "Clinical Assessment",
            ].map((step, i, arr) => (
              <span key={step} className="voice-flow-item">
                <span className="voice-flow-label">{step}</span>
                {i < arr.length - 1 && <ChevronRight size={14} style={{ flexShrink: 0, color: "var(--text-muted)" }} />}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Demo card */}
        <div className="voice-demo-card">
          <div className="vdc-header">
            <div className="vdc-mic-btn" aria-label="Voice input active (demo)">
              <Mic size={20} />
            </div>
            <div>
              <div className="vdc-title">Voice Input — Hindi</div>
              <div className="vdc-subtitle">Browser speech recognition active</div>
            </div>
          </div>

          <div className="vdc-transcript-block">
            <div className="vdc-transcript-label">
              <Globe size={13} />
              ORIGINAL (Hindi)
            </div>
            <div className="vdc-transcript-text vdc-original">
              &quot;Mera sir dard kar raha hai aur bukhar bhi hai&quot;
            </div>
          </div>

          <div className="vdc-arrow">↓</div>

          <div className="vdc-transcript-block">
            <div className="vdc-transcript-label">
              <CheckCircle size={13} style={{ color: "var(--green-400)" }} />
              ENGLISH TRANSLATION
            </div>
            <div className="vdc-transcript-text vdc-translated">
              &quot;I have a headache and also have a fever&quot;
            </div>
          </div>

          <div className="vdc-note">
            <ShieldCheck size={12} color="var(--green-400)" />
            Original patient statement is always preserved
          </div>
        </div>
      </div>
    </section>
  );
}

function ExplainableAISection() {
  return (
    <section className="lp-section xai-section" aria-labelledby="xai-title">
      <div className="lp-container xai-container">
        {/* Left: Result Demo */}
        <div className="xai-result-card">
          {/* Header */}
          <div className="xai-rc-header">
            <span className="xai-rc-eyebrow">TRIAGE RESULT</span>
            <span className="badge badge-red" style={{ fontSize: "13px", padding: "5px 14px" }}>EMERGENCY</span>
          </div>

          <div className="xai-rc-level">Immediate Clinical Evaluation</div>

          {/* Why section */}
          <div className="xai-why-section">
            <div className="xai-why-title">Why this result?</div>
            <div className="xai-factors">
              <div className="xai-factor xai-factor-red">
                <AlertTriangle size={14} />
                <div>
                  <strong>Critical Vital Signs</strong>
                  <span>SpO₂ 88% · HR 124 bpm · BP 178/106</span>
                </div>
              </div>
              <div className="xai-factor xai-factor-red">
                <AlertTriangle size={14} />
                <div>
                  <strong>High-Risk Symptoms</strong>
                  <span>Chest pain, dyspnea, profuse sweating</span>
                </div>
              </div>
              <div className="xai-factor xai-factor-orange">
                <Activity size={14} />
                <div>
                  <strong>Risk Indicators</strong>
                  <span>Age 54, male — elevated cardiac risk profile</span>
                </div>
              </div>
            </div>
          </div>

          <div className="xai-recommendation">
            <span className="xai-rec-label">Recommended Next Step</span>
            <span className="xai-rec-text">Immediate Resuscitation Bay · Emergency Medicine</span>
          </div>

          <div className="xai-disclaimer">
            AI-assisted assessment. Does not replace professional medical judgment.
          </div>

          <div className="xai-actions">
            <button className="xai-btn xai-btn-accept">Accept Assessment</button>
            <button className="xai-btn xai-btn-modify">Modify</button>
            <button className="xai-btn xai-btn-note">Add Note</button>
          </div>
        </div>

        {/* Right: Copy */}
        <div className="xai-copy">
          <span className="lp-eyebrow">EXPLAINABLE AI</span>
          <h2 id="xai-title" className="lp-heading" style={{ textAlign: "left" }}>
            See exactly why a decision was made.
          </h2>
          <p className="lp-subheading" style={{ textAlign: "left" }}>
            Every triage result shows the specific symptoms, vital sign
            readings, and risk indicators that contributed to the outcome.
            No black-box decisions.
          </p>

          <div className="xai-features-list">
            {[
              { icon: <Eye size={16} />, text: "Contributing factors shown clearly" },
              { icon: <Activity size={16} />, text: "Vital signs flagged with context" },
              { icon: <Brain size={16} />, text: "AI reasoning is transparent" },
              { icon: <ShieldCheck size={16} />, text: "Clinician always has final say" },
            ].map((f) => (
              <div key={f.text} className="xai-feature-item">
                <div className="xai-feature-icon">{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <Link href="/intake" className="btn-primary" style={{ display: "inline-flex", marginTop: "28px" }}>
            See Full Assessment Demo
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HumanInLoopSection() {
  return (
    <section className="lp-section hitl-section" aria-labelledby="hitl-title">
      <div className="lp-container">
        <header className="lp-section-header">
          <span className="lp-eyebrow">HUMAN-IN-THE-LOOP</span>
          <h2 id="hitl-title" className="lp-heading">
            AI supports. Clinicians decide.
          </h2>
          <p className="lp-subheading">
            Every AI-assisted assessment is reviewed and confirmed by a qualified
            healthcare professional before any action is taken.
          </p>
        </header>

        <div className="hitl-cards">
          <div className="hitl-card">
            <div className="hitl-card-icon" style={{ background: "var(--blue-bg)", color: "var(--blue-400)" }}>
              <Brain size={22} />
            </div>
            <h3>AI Assessment</h3>
            <p>
              TriageX analyzes symptoms, vitals, and risk factors to generate
              an urgency classification and contributing factors.
            </p>
          </div>
          <div className="hitl-arrow">→</div>
          <div className="hitl-card hitl-card-center">
            <div className="hitl-card-icon" style={{ background: "var(--green-bg)", color: "var(--green-400)" }}>
              <Stethoscope size={22} />
            </div>
            <h3>Clinician Review</h3>
            <p>
              The clinician reviews the AI decision, contributing factors, and
              patient data — then accepts, modifies, or overrides.
            </p>
          </div>
          <div className="hitl-arrow">→</div>
          <div className="hitl-card">
            <div className="hitl-card-icon" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
              <CheckCircle size={22} />
            </div>
            <h3>Confirmed Triage</h3>
            <p>
              The final triage decision is recorded with clinician confirmation,
              ready for facility routing and response coordination.
            </p>
          </div>
        </div>

        <div className="hitl-disclaimer">
          <ShieldCheck size={16} color="var(--green-400)" />
          <span>
            &quot;TriageX provides decision support. Final clinical judgment remains with the healthcare professional.&quot;
          </span>
        </div>
      </div>
    </section>
  );
}

function DemoScenariosSection() {
  return (
    <section className="lp-section demo-section" aria-labelledby="demo-title">
      <div className="lp-container">
        <header className="lp-section-header">
          <span className="lp-eyebrow">HACKATHON DEMO</span>
          <h2 id="demo-title" className="lp-heading">
            Try a Demo Scenario
          </h2>
          <p className="lp-subheading">
            Explore two clearly synthetic demo cases to see how TriageX handles
            different triage situations. All data is fabricated — not real patients.
          </p>
        </header>

        <div className="demo-scenario-cards">
          {/* Routine Case */}
          <div className="demo-scenario-card demo-scenario-routine">
            <div className="demo-scenario-badge">DEMO CASE — ROUTINE</div>
            <div className="demo-scenario-tag">DEMO DATA — NOT A REAL PATIENT</div>
            <div className="demo-scenario-level routine-level">ROUTINE</div>
            <p className="demo-scenario-desc">
              Standard OPD visit. Mild headache, no abnormal vitals. AI
              classifies as routine with standard consultation recommendation.
            </p>
            <Link href="/intake" className="demo-scenario-btn demo-btn-routine">
              Try Routine Demo
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Emergency Case */}
          <div className="demo-scenario-card demo-scenario-emergency">
            <div className="demo-scenario-badge">DEMO CASE — EMERGENCY</div>
            <div className="demo-scenario-tag">DEMO DATA — NOT A REAL PATIENT</div>
            <div className="demo-scenario-level emergency-level">EMERGENCY</div>
            <p className="demo-scenario-desc">
              Severe chest pain, critical SpO₂ 88%, tachycardia. Demonstrates
              how configured risk indicators trigger emergency classification.
            </p>
            <Link href="/dashboard" className="demo-scenario-btn demo-btn-emergency">
              See Emergency Demo
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="demo-disclaimer">
          <AlertTriangle size={14} />
          <span>
            These scenarios use fabricated data for demonstration purposes only.
            TriageX does not claim to definitively diagnose medical emergencies.
          </span>
        </div>
      </div>
    </section>
  );
}

function AnalyticsPreviewSection() {
  return (
    <section className="lp-section analytics-preview-section" aria-labelledby="analytics-title">
      <div className="lp-container analytics-preview-container">
        {/* Left: Copy */}
        <div className="ap-copy">
          <span className="lp-eyebrow">ANALYTICS</span>
          <h2 id="analytics-title" className="lp-heading" style={{ textAlign: "left" }}>
            Real-time facility insights.
          </h2>
          <p className="lp-subheading" style={{ textAlign: "left" }}>
            Track triage volume, severity distribution, and assessment trends
            across your facility. All data from actual assessments — no fake statistics.
          </p>

          <div className="ap-stats">
            {[
              { label: "Total Assessments", icon: <Users size={18} />, color: "blue" },
              { label: "Emergency Cases", icon: <AlertTriangle size={18} />, color: "red" },
              { label: "Urgent Cases", icon: <Clock size={18} />, color: "orange" },
              { label: "Routine Cases", icon: <CheckCircle size={18} />, color: "green" },
            ].map((s) => (
              <div key={s.label} className={`ap-stat-item ap-stat-${s.color}`}>
                <div className="ap-stat-icon">{s.icon}</div>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <Link href="/analytics" className="btn-secondary" style={{ display: "inline-flex", marginTop: "24px" }}>
            <BarChart3 size={16} />
            Open Analytics Dashboard
          </Link>
        </div>

        {/* Right: Mini preview */}
        <div className="ap-preview-card">
          <div className="ap-preview-header">
            <BarChart3 size={16} />
            <span>Triage Distribution</span>
            <span className="ap-preview-live">LIVE</span>
          </div>
          <div className="ap-chart-bars">
            <div className="ap-chart-bar">
              <div className="ap-bar-fill ap-bar-red" style={{ height: "60%" }} />
              <span>Emergency</span>
            </div>
            <div className="ap-chart-bar">
              <div className="ap-bar-fill ap-bar-orange" style={{ height: "45%" }} />
              <span>Urgent</span>
            </div>
            <div className="ap-chart-bar">
              <div className="ap-bar-fill ap-bar-green" style={{ height: "85%" }} />
              <span>Routine</span>
            </div>
          </div>
          <div className="ap-preview-note">
            Reflecting actual TriageX assessment data
          </div>
        </div>
      </div>
    </section>
  );
}

function ResponsibleAISection() {
  const principles = [
    {
      icon: <Users size={20} />,
      title: "Human-in-the-Loop",
      body: "Every AI assessment requires clinician review and confirmation before becoming a final decision.",
    },
    {
      icon: <Eye size={20} />,
      title: "Explainable Assessment",
      body: "Triage results show the specific factors that contributed — symptoms, vitals, and risk indicators.",
    },
    {
      icon: <Globe size={20} />,
      title: "Multilingual Accessibility",
      body: "Supports 13 Indian languages via browser-based speech recognition to eliminate language barriers.",
    },
    {
      icon: <ShieldCheck size={20} />,
      title: "Privacy-Conscious Design",
      body: "Patient data is processed locally in this demo. No data is shared with third-party services for AI inference.",
    },
    {
      icon: <AlertTriangle size={20} />,
      title: "Clear AI Limitations",
      body: "TriageX is a decision support tool. It is not a diagnostic system and does not replace clinical judgment.",
    },
  ];

  return (
    <section className="lp-section rai-section" aria-labelledby="rai-title">
      <div className="lp-container">
        <header className="lp-section-header">
          <span className="lp-eyebrow">RESPONSIBLE AI</span>
          <h2 id="rai-title" className="lp-heading">
            Designed for Responsible AI-Assisted Triage
          </h2>
        </header>

        <div className="rai-cards">
          {principles.map((p) => (
            <div key={p.title} className="rai-card">
              <div className="rai-icon">{p.icon}</div>
              <h3 className="rai-card-title">{p.title}</h3>
              <p className="rai-card-body">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="lp-section final-cta-section" aria-labelledby="final-cta-title">
      <div className="lp-container">
        <div className="final-cta-card">
          <div className="final-cta-glow" aria-hidden="true" />
          <span className="lp-eyebrow" style={{ color: "var(--blue-400)" }}>GET STARTED</span>
          <h2 id="final-cta-title" className="final-cta-heading">
            Ready to see TriageX in action?
          </h2>
          <p className="final-cta-body">
            Assess a patient, explore explainable triage, and experience
            multilingual clinical support — in under 3 minutes.
          </p>
          <div className="final-cta-actions">
            <Link href="/intake" className="btn-primary" style={{ fontSize: "16px", padding: "16px 36px" }}>
              <UserPlus size={19} />
              Start Patient Assessment
              <ArrowRight size={17} />
            </Link>
            <Link href="/dashboard" className="btn-secondary" style={{ fontSize: "15px" }}>
              <Stethoscope size={17} />
              Clinician Queue
            </Link>
          </div>
          <div className="final-cta-features">
            <span><CheckCircle size={13} color="var(--green-400)" /> No setup required</span>
            <span><CheckCircle size={13} color="var(--green-400)" /> Full demo flow</span>
            <span><CheckCircle size={13} color="var(--green-400)" /> Real triage logic</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="lp-footer" aria-label="TriageX footer">
      <div className="lp-container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <img src="/logo.png" alt="TriageX" style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid rgba(240,68,87,0.4)" }} />
              <span>Triage<span className="footer-logo-x">X</span></span>
            </Link>
            <p className="footer-tagline">
              Smarter Triage. Faster Decisions. Better Care.
            </p>
            <p className="footer-disclaimer">
              AI-assisted decision support. Not a replacement for professional medical judgment.
            </p>
          </div>

          {/* Links */}
          <nav className="footer-links" aria-label="Footer navigation">
            <div className="footer-links-col">
              <div className="footer-links-title">Product</div>
              <Link href="/" className="footer-link">Home</Link>
              <Link href="/#how-it-works" className="footer-link">How It Works</Link>
              <Link href="/intake" className="footer-link">Patient Assessment</Link>
              <Link href="/dashboard" className="footer-link">Clinician Queue</Link>
              <Link href="/analytics" className="footer-link">Analytics</Link>
            </div>
            <div className="footer-links-col">
              <div className="footer-links-title">Key Features</div>
              <span className="footer-link-static">AI-Assisted Triage</span>
              <span className="footer-link-static">Multilingual Voice</span>
              <span className="footer-link-static">Explainable Results</span>
              <span className="footer-link-static">Human-in-the-Loop</span>
            </div>
          </nav>
        </div>

        <div className="footer-bottom">
          <span className="footer-bottom-text">
            © 2026 TriageX · AI-Assisted Multilingual Patient Triage
          </span>
          <span className="footer-bottom-text footer-safety">
            <ShieldCheck size={13} />
            AI-assisted · Human-reviewed · Not a standalone diagnostic system
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page Export ─────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <VoiceSection />
      <ExplainableAISection />
      <HumanInLoopSection />
      <DemoScenariosSection />
      <AnalyticsPreviewSection />
      <ResponsibleAISection />
      <FinalCTASection />
      <Footer />
    </>
  );
}