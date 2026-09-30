"use client";

import CyberHeart3D from "./components/CyberHeart3D";
import Link from "next/link";
import Navbar from "./components/Navbar";
import { UserPlus, Stethoscope, ArrowRight, ShieldCheck, HeartPulse, Globe2, Activity, FileText, ClipboardList, Clock } from "lucide-react";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="hero">
        {/* Cybernetic 3D Heart Background */}
        <div className="spline-wrapper">
          <CyberHeart3D />
        </div>

        {/* Dark overlay */}
        <div className="hero-overlay" />

        {/* Left Hero Content */}
        <section className="hero-content">
          <img
            src="/logo.png"
            alt="TriageX Medical Icon"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              objectFit: 'cover',
              marginBottom: '24px',
              boxShadow: '0 0 24px rgba(255, 0, 40, 0.6)',
              border: '1px solid rgba(255, 80, 100, 0.8)'
            }}
          />

          <h1>
            Triage<span>X</span>
          </h1>

          <h2>
            Multimodal Healthcare Triage Assistant
          </h2>

          <p>
            AI-assisted clinical triage note summarizer and priority queue manager for government hospitals, PHCs, public health camps, and campus health units. Designed for India-wide contexts with human-in-the-loop qualified medical review.
          </p>

          {/* Interactive Navigation Buttons */}
          <div className="hero-actions">
            <Link href="/intake" className="btn-primary">
              <UserPlus size={18} />
              Patient Intake Kiosk
              <ArrowRight size={18} />
            </Link>

            <Link href="/dashboard" className="btn-secondary">
              <Stethoscope size={18} />
              Doctor Triage Dashboard
            </Link>
          </div>

          {/* Trust & Safety Disclaimer */}
          <div style={{
            marginTop: '14px',
            fontSize: '12px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500
          }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>AI-assisted • Human-reviewed • Not a standalone diagnostic system</span>
          </div>

          {/* Quick India-Specific Feature Badges */}
          <div className="hero-feature-grid">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '13px',
              color: '#cbd5e1'
            }}>
              <Globe2 size={16} color="#ff2948" />
              <span>Multi-lingual Support (8 Languages)</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '13px',
              color: '#cbd5e1'
            }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>Human-In-The-Loop Approval</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '13px',
              color: '#cbd5e1'
            }}>
              <HeartPulse size={16} color="#f59e0b" />
              <span>Vitals & Lab OCR Assessment</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '13px',
              color: '#cbd5e1'
            }}>
              <Activity size={16} color="#3b82f6" />
              <span>Real-Time Priority Sorting</span>
            </div>
          </div>
        </section>

        {/* Right Overlay Cards: Medically Responsible Product Flow Cards */}
        <section className="hero-cards-wrapper">
          {/* Card 1: Patient Intake */}
          <div className="hero-triage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>
                PATIENT INTAKE
              </span>
              <span style={{ fontSize: '11px', color: '#ff2948', fontWeight: 700, background: 'rgba(255, 41, 72, 0.12)', padding: '2px 8px', borderRadius: '10px' }}>
                Hindi Vernacular
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
              Patient: Ramesh V. (54y, M)
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClipboardList size={14} color="#ff2948" />
              <span>Symptoms: 4 reported (Chest Pain, Dyspnea)</span>
            </div>
          </div>

          {/* Card 2: AI Triage & Clinical Status */}
          <div className="hero-triage-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#f87171', letterSpacing: '0.5px' }}>
                AI TRIAGE ASSESSMENT
              </span>
              <span className="badge-red">Level 1 - RED</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#fbbf24" /> Clinical Review: PENDING
            </div>
            <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '4px', fontWeight: 600 }}>
              Awaiting Healthcare Worker Confirmation
            </div>
          </div>

          {/* Card 3: Multimodal Clinical Evidence */}
          <div className="hero-triage-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px' }}>
                CLINICAL EVIDENCE & VITALS
              </span>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                SpO₂ 92% · HR 112 bpm
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} color="#38bdf8" />
              <span>ECG Telemetry + Lab Report Parsed</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Priority Score: 95/100 • Target Response: &lt; 5 mins
            </div>
          </div>
        </section>

        {/* Small bottom status label */}
        <div className="bottom-label">
          <span className="status-dot"></span>
          TRIAGEX PLATFORM • AI-ASSISTED • HUMAN-REVIEWED • NOT A STANDALONE DIAGNOSTIC SYSTEM
        </div>
      </main>
    </>
  );
}