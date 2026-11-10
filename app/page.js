import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  AudioLines,
  BrainCircuit,
  Check,
  ChevronRight,
  Clock3,
  HeartPulse,
  MapPin,
  Search,
  ShieldCheck,
  Thermometer,
} from "lucide-react";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter";

const features = [
  {
    icon: <Activity size={21} />,
    title: "Instant Triage",
    description:
      "Share symptoms and available vital signs in a guided assessment, then receive a clear, explainable result.",
    tone: "blue",
    href: "/intake",
    linkLabel: "Start an assessment",
  },
  {
    icon: <Clock3 size={21} />,
    title: "Prioritize Care",
    description:
      "Clinical rules organize cases by urgency so care teams can focus attention where it is needed first.",
    tone: "mint",
    href: "/dashboard",
    linkLabel: "View the clinician queue",
  },
  {
    icon: <MapPin size={21} />,
    title: "Find Nearby Help",
    description:
      "Choose from supported health facilities during intake and route an assessment to the right care team.",
    tone: "cyan",
    href: "/services",
    linkLabel: "Explore supported services",
  },
  {
    icon: <HeartPulse size={21} />,
    title: "Health Information",
    description:
      "Explore practical health information and know when an online assessment is not the right next step.",
    tone: "green",
    href: "/health-info",
    linkLabel: "Read health information",
  },
];

function DoctorIllustration() {
  return (
    <Image
      className="doctor-art"
      src="/triagex-doctor.png"
      width={768}
      height={1152}
      alt="3D illustration of a smiling doctor holding a medical tablet"
      priority
    />
  );
}

function HeroSection() {
  return (
    <section className="site-hero-section" aria-labelledby="hero-title">
      <div className="site-hero-grid" aria-hidden="true" />
      <div className="site-container site-hero">
        <div className="site-hero-copy">
          <div className="site-eyebrow">
            <ShieldCheck size={16} />
            AI-powered healthcare triage
          </div>
          <h1 id="hero-title">
            Get the Right Care,
            <span> Right Away</span>
          </h1>
          <p className="site-hero-description">
            TriageX helps you assess symptoms, prioritize care, and connect with
            the right healthcare service — faster.
          </p>
          <div className="site-hero-actions">
            <Link href="/intake" className="site-button site-button-primary">
              <Search size={17} /> Start Triage <ArrowRight size={17} />
            </Link>
            <a href="#how-it-works" className="site-button site-button-secondary">
              <span className="site-play-icon">▶</span> Watch Demo
            </a>
          </div>
          <div className="site-trust-row">
            <span><ShieldCheck size={16} /> Clinician-reviewed</span>
            <span><AudioLines size={16} /> Multilingual input</span>
            <span><BrainCircuit size={16} /> Explainable results</span>
          </div>
        </div>

        <div className="site-hero-visual" aria-label="TriageX care assistant preview">
          <div className="site-visual-orbit site-visual-orbit-one" />
          <div className="site-visual-orbit site-visual-orbit-two" />
          <span className="site-hero-plus site-hero-plus-one" aria-hidden="true">+</span>
          <span className="site-hero-plus site-hero-plus-two" aria-hidden="true">+</span>
          <div className="site-doctor-card">
            <div className="site-doctor-glow" />
            <DoctorIllustration />
          </div>
          <div className="site-symptom-card">
            <div className="site-symptom-card-heading">
              <span><strong>Symptom Check</strong><small>Structured information for review</small></span>
            </div>
            <div className="site-symptom-list">
              {["Fever", "Cough", "Breathing problem", "Other symptoms"].map((item) => (
                <span key={item}><Check size={12} /> {item}</span>
              ))}
            </div>
            <Link href="/intake" className="site-symptom-cta">Get Guidance <ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>
      <FeatureSection compact />
    </section>
  );
}

function FeatureSection({ compact = false }) {
  return (
    <section className={`site-section site-feature-section${compact ? " site-feature-section-compact" : ""}`} id="features" aria-labelledby="features-title">
      <div className="site-container">
        {!compact && <div className="site-section-heading">
          <span className="site-kicker">CARE, MADE CLEARER</span>
          <h2 id="features-title">A smarter first step to better care.</h2>
          <p>Thoughtful tools help patients share what matters and help care teams respond with clarity.</p>
        </div>}
        <div className="site-feature-grid">
          {features.map((feature) => (
            <Link className="site-feature-card" key={feature.title} href={feature.href} aria-label={`${feature.title}: ${feature.linkLabel}`}>
              <div className={`site-feature-icon site-feature-icon-${feature.tone}`}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p className="site-feature-subtitle">{feature.title === "Instant Triage" ? "Assess your symptoms in seconds" : feature.title === "Prioritize Care" ? "Know what to do next" : feature.title === "Find Nearby Help" ? "Locate supported care facilities" : "Stay informed, stay well"}</p>
              <span className="site-feature-arrow" aria-hidden="true"><ChevronRight size={17} /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HealthSection() {
  return (
    <section className="site-section site-health-section" id="health-info" aria-labelledby="health-title">
      <div className="site-container site-health-layout">
        <div className="site-health-copy">
          <span className="site-kicker">YOUR HEALTH. OUR PRIORITY.</span>
          <h2 id="health-title">Smarter Healthcare for a <strong>Healthier</strong> Tomorrow.</h2>
          <p>
            TriageX brings symptom details and vital signs together in a
            structured assessment. It helps people communicate concerns and
            helps clinicians review urgency — with people always in control of
            care decisions.
          </p>
          <ul className="site-check-list">
            <li><Check size={16} /> Guided symptom and vital collection</li>
            <li><Check size={16} /> Original speech preserved alongside translation</li>
            <li><Check size={16} /> Clear next steps with clinician review</li>
          </ul>
          <Link href="/health-info" className="site-text-link">Explore health information <ArrowRight size={16} /></Link>
        </div>

        <div className="site-health-dashboard" id="health-dashboard">
          <div className="site-dashboard-header">
            <div><span className="site-dashboard-label">HEALTH OVERVIEW</span><h3>Vitals at a glance</h3></div>
            <span className="site-sample-tag"><span /> Sample data</span>
          </div>
          <p className="site-sample-note">Illustrative values only — not measured or linked to a person.</p>
          <div className="site-metric-grid">
            <article className="site-metric-card">
              <span className="site-metric-icon site-metric-heart"><HeartPulse size={17} /></span>
              <span className="site-metric-name">Heart Rate</span>
              <strong>72 <small>bpm</small></strong>
              <span className="site-metric-state">Sample reading</span>
            </article>
            <article className="site-metric-card">
              <span className="site-metric-icon site-metric-temp"><Thermometer size={17} /></span>
              <span className="site-metric-name">Body Temperature</span>
              <strong>36.8 <small>°C</small></strong>
              <span className="site-metric-state">Sample reading</span>
            </article>
            <article className="site-metric-card site-metric-wide">
              <span className="site-metric-icon site-metric-oxygen"><Activity size={17} /></span>
              <span className="site-metric-name">SpO₂</span>
              <strong>98 <small>%</small></strong>
              <span className="site-metric-state">Sample reading</span>
            </article>
          </div>
          <div className="site-ecg-card">
            <div className="site-ecg-label"><span><Activity size={15} /> HEART RHYTHM</span><small>Illustrative waveform</small></div>
            <svg viewBox="0 0 520 76" role="img" aria-label="Decorative sample ECG-style waveform">
              <path className="site-ecg-gridline" d="M0 19h520M0 38h520M0 57h520M65 0v76m65-76v76m65-76v76m65-76v76m65-76v76m65-76v76m65-76v76m65-76v76" />
              <path className="site-ecg-line" d="M0 39h48l12-1 8-5 9 10 10-4h52l12-1 10-7 10 16 11-43 13 57 12-24 10 2h64l12-1 9-5 10 10 10-4h52l12-1 10-7 10 16 11-42 13 56 12-24 10 2h82" />
            </svg>
          </div>
        </div>
        <div className="site-health-illustration" aria-hidden="true">
          <svg viewBox="0 0 260 290">
            <defs>
              <linearGradient id="shield-gradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#52c2ed" />
                <stop offset=".55" stopColor="#187be0" />
                <stop offset="1" stopColor="#1756c0" />
              </linearGradient>
              <linearGradient id="shield-edge" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#9ee8ff" />
                <stop offset="1" stopColor="#2692e1" />
              </linearGradient>
              <filter id="shield-shadow" x="-30%" y="-30%" width="160%" height="170%">
                <feDropShadow dx="0" dy="14" floodColor="#267db5" floodOpacity=".23" stdDeviation="12" />
              </filter>
            </defs>
            <circle cx="130" cy="143" r="112" fill="#d9f4f2" opacity=".62" />
            <circle cx="40" cy="80" r="8" fill="#80dcca" /><circle cx="218" cy="52" r="6" fill="#8cded0" />
            <path d="m130 34 76 30-8 94c-8 40-35 69-68 88-33-19-60-48-68-88l-8-94 76-30Z" fill="url(#shield-edge)" filter="url(#shield-shadow)" />
            <path d="m130 46 63 25-7 82c-7 33-28 57-56 75-28-18-49-42-56-75l-7-82 63-25Z" fill="url(#shield-gradient)" />
            <path d="M116 88h28v25h25v28h-25v25h-28v-25H91v-28h25V88Z" fill="#fff" />
            <path d="M89 224c21 23 48 34 73 38m-65-2 4 18m78-23c-9 7-18 12-28 16" fill="none" stroke="#32b99d" strokeLinecap="round" strokeWidth="7" />
            <path d="M203 176c23 7 31 20 24 34-6 12-20 11-27 1l-17-22m32-20c4-8 14-13 22-9 9 5 8 15 1 20l-16 12m-11 20 12 22c5 9 2 20-7 23-8 3-16-3-20-10l-15-28" fill="none" stroke="#345b74" strokeLinecap="round" strokeWidth="7" />
            <circle cx="201" cy="192" r="12" fill="none" stroke="#345b74" strokeWidth="6" />
          </svg>
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    { number: "01", title: "Tell us what’s going on", text: "Describe symptoms in text or use supported browser voice input." },
    { number: "02", title: "Add helpful details", text: "Share available vital signs and choose a participating health facility." },
    { number: "03", title: "Review next steps", text: "See an explainable urgency assessment and send it to the clinician queue." },
  ];

  return (
    <section className="site-section site-workflow-section" id="how-it-works" aria-labelledby="workflow-title">
      <div className="site-container">
        <div className="site-section-heading">
          <span className="site-kicker">HOW TRIAGEX WORKS</span>
          <h2 id="workflow-title">A thoughtful first step, in three parts.</h2>
          <p>Get started with the existing TriageX assessment workflow.</p>
        </div>
        <div className="site-workflow-grid">
          {steps.map((step) => (
            <article className="site-workflow-card" key={step.number}>
              <span className="site-workflow-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <div className="site-workflow-cta">
          <Link href="/intake" className="site-button site-button-primary">Start a triage assessment <ArrowRight size={17} /></Link>
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  return (
    <section className="site-safety-section" aria-label="Important medical safety information">
      <div className="site-container site-safety-inner">
        <span className="site-safety-icon"><ShieldCheck size={20} /></span>
        <div>
          <strong>Support for care decisions — not a diagnosis.</strong>
          <p>TriageX provides decision support and does not replace professional medical advice. For a medical emergency, contact your local emergency service immediately.</p>
        </div>
        <Link href="/health-info" className="site-text-link">Read safety information <ArrowRight size={15} /></Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HealthSection />
        <WorkflowSection />
        <SafetySection />
      </main>
      <SiteFooter />
    </>
  );
}
