'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Stethoscope, UserPlus, BarChart3, AlertCircle, ShieldAlert, Menu, X, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [stats, setStats] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch('/api/triage/stats')
      .then(res => res.json())
      .then(res => {
        if (res.success) setStats(res.data);
      })
      .catch(err => console.error(err));
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`app-header ${scrolled ? 'app-header-scrolled' : ''}`}>
        {/* Mobile Left: Home Button */}
        <Link
          href="/"
          className={`mobile-home-btn ${pathname === '/' ? 'active' : ''}`}
          aria-label="Home page"
          aria-current={pathname === '/' ? 'page' : undefined}
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
                boxShadow: '0 0 10px rgba(232, 32, 58, 0.28)',
                border: '1px solid rgba(240, 68, 87, 0.45)'
              }}
            />
            <div className="brand-text">
              Triage<span>X</span>
            </div>
          </Link>

          {/* Demo Mode Badge */}
          <span className="demo-mode-badge">
            <ShieldAlert size={12} />
            <span>DEMO</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-nav-links" aria-label="Main navigation">
          <Link
            href="/"
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <Home size={15} />
            Home
          </Link>

          <Link
            href="/#how-it-works"
            className="nav-link"
          >
            How It Works
          </Link>

          <Link
            href="/intake"
            className={`nav-link ${pathname === '/intake' ? 'active' : ''}`}
            aria-current={pathname === '/intake' ? 'page' : undefined}
          >
            <Activity size={15} />
            Assessment
          </Link>

          <Link
            href="/dashboard"
            className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
            aria-current={pathname === '/dashboard' ? 'page' : undefined}
          >
            <Stethoscope size={15} />
            Clinician Queue
            {stats && stats.pendingCount > 0 && (
              <span style={{
                background: 'var(--blue-bg)',
                color: 'var(--blue-400)',
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
            aria-current={pathname === '/analytics' ? 'page' : undefined}
          >
            <BarChart3 size={15} />
            Analytics
          </Link>
        </nav>

        {/* Desktop CTA */}
        <Link href="/intake" className="nav-cta-btn desktop-nav-links" aria-label="Start Patient Assessment">
          <UserPlus size={15} />
          Start Assessment
        </Link>

        {/* Mobile Right: Menu Toggle Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          <span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>
        </button>
      </header>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <nav id="mobile-navigation" className="mobile-dropdown-menu" aria-label="Mobile navigation">
          <Link
            href="/"
            className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <Home size={18} />
            <span>Home</span>
          </Link>

          <Link
            href="/#how-it-works"
            className="mobile-nav-item"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Activity size={18} />
            <span>How It Works</span>
          </Link>

          <Link
            href="/intake"
            className={`mobile-nav-item ${pathname === '/intake' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={pathname === '/intake' ? 'page' : undefined}
          >
            <UserPlus size={18} />
            <span>Patient Assessment</span>
          </Link>

          <Link
            href="/dashboard"
            className={`mobile-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            aria-current={pathname === '/dashboard' ? 'page' : undefined}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Stethoscope size={18} />
              <span>Clinician Queue</span>
            </div>
            {stats && stats.pendingCount > 0 && (
              <span style={{
                background: 'var(--blue-bg)',
                color: 'var(--blue-400)',
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
            aria-current={pathname === '/analytics' ? 'page' : undefined}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </Link>

          <Link
            href="/intake"
            className="mobile-nav-item mobile-nav-cta"
            onClick={() => setMobileMenuOpen(false)}
          >
            <UserPlus size={18} />
            <span>Start Assessment</span>
          </Link>
        </nav>
      )}

      {/* Dynamic Emergency Alert Banner */}
      {stats && stats.pendingRedCount > 0 && (
        <div className="emergency-ticker">
          <div className="ticker-content">
            <div className="live-dot" />
            <AlertCircle size={18} />
            <span>
              DEMO ALERT · {stats.pendingRedCount} Level 1 (RED) {stats.pendingRedCount === 1 ? 'patient needs' : 'patients need'} immediate review.
            </span>
          </div>
          <Link
            href="/dashboard?triageLevel=RED"
            style={{
              color: 'var(--red-400)',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'underline'
            }}
          >
            Open Emergency Queue &rarr;
          </Link>
        </div>
      )}
    </>
  );
}
