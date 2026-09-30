'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Stethoscope, UserPlus, BarChart3, AlertCircle, ShieldAlert, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [stats, setStats] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/triage/stats')
      .then(res => res.json())
      .then(res => {
        if (res.success) setStats(res.data);
      })
      .catch(err => console.error(err));
  }, [pathname]);

  // Close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="app-header">
        {/* Mobile Left: Home Button */}
        <Link
          href="/"
          className={`mobile-home-btn ${pathname === '/' ? 'active' : ''}`}
          aria-label="Home page"
        >
          <Home size={18} />
          <span>Home</span>
        </Link>

        {/* Center: Brand Logo Header */}
        <div className="header-brand-container">
          <Link href="/" className="brand-logo">
            <img
              src="/logo.png"
              alt="TriageX Logo"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                objectFit: 'cover',
                boxShadow: '0 0 14px rgba(255, 41, 72, 0.5)',
                border: '1px solid rgba(255, 60, 80, 0.6)'
              }}
            />
            <div className="brand-text">
              Triage<span>X</span>
            </div>
          </Link>

          {/* Demo Mode Badge */}
          <span className="demo-mode-badge">
            <ShieldAlert size={12} />
            <span>DEMO MODE</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-nav-links">
          <Link
            href="/"
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
          >
            <Home size={16} />
            Home
          </Link>

          <Link
            href="/intake"
            className={`nav-link ${pathname === '/intake' ? 'active' : ''}`}
          >
            <UserPlus size={16} />
            Patient Intake
          </Link>

          <Link
            href="/dashboard"
            className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            <Stethoscope size={16} />
            Clinician Queue
            {stats && stats.pendingCount > 0 && (
              <span style={{
                background: '#ff2948',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {stats.pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/analytics"
            className={`nav-link ${pathname === '/analytics' ? 'active' : ''}`}
          >
            <BarChart3 size={16} />
            Facility Analytics
          </Link>
        </nav>

        {/* Mobile Right: Menu Toggle Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          <span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>
        </button>
      </header>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-dropdown-menu">
          <Link
            href="/"
            className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home size={18} />
            <span>Home</span>
          </Link>

          <Link
            href="/intake"
            className={`mobile-nav-item ${pathname === '/intake' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <UserPlus size={18} />
            <span>Patient Intake Kiosk</span>
          </Link>

          <Link
            href="/dashboard"
            className={`mobile-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Stethoscope size={18} />
              <span>Clinician Queue</span>
            </div>
            {stats && stats.pendingCount > 0 && (
              <span style={{
                background: '#ff2948',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {stats.pendingCount} pending
              </span>
            )}
          </Link>

          <Link
            href="/analytics"
            className={`mobile-nav-item ${pathname === '/analytics' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <BarChart3 size={18} />
            <span>Facility Analytics</span>
          </Link>
        </div>
      )}

      {/* Dynamic Emergency Alert Banner */}
      {stats && stats.pendingRedCount > 0 && (
        <div className="emergency-ticker">
          <div className="ticker-content">
            <div className="live-dot" />
            <AlertCircle size={18} />
            <span>
              DEMO ALERT · {stats.pendingRedCount} Level 1 (RED) Patient requires immediate clinical review across active facilities
            </span>
          </div>
          <Link
            href="/dashboard?triageLevel=RED"
            style={{
              color: '#fef2f2',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'underline'
            }}
          >
            View Emergency Queue &rarr;
          </Link>
        </div>
      )}
    </>
  );
}
