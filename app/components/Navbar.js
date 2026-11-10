'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  ClipboardCheck,
  HeartPulse,
  Home,
  Menu,
  Moon,
  Sun,
  Stethoscope,
  X,
  UserRound,
} from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { applyPreferencesToDocument } from '@/lib/appearance';
import { DEFAULT_PREFERENCES } from '@/lib/account-preferences';

const navigation = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/patient-dashboard', label: 'My Health', icon: HeartPulse },
  { href: '/intake', label: 'Triage', icon: Activity },
  { href: '/services', label: 'Services', icon: Building2 },
  { href: '/health-info', label: 'Health Info', icon: HeartIcon },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/about', label: 'About', icon: Stethoscope },
  { href: '/contact', label: 'Contact', icon: AlertCircle },
];

function HeartIcon({ size = 16 }) {
  return <Activity size={size} />;
}

function subscribeToTheme(callback) {
  window.addEventListener('triagex-theme-change', callback);
  return () => window.removeEventListener('triagex-theme-change', callback);
}

function getThemeSnapshot() {
  return document.documentElement.dataset.theme === 'dark';
}

export default function Navbar() {
  const pathname = usePathname();
  const [stats, setStats] = useState(null);
  const [account, setAccount] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);

  useEffect(() => {
    fetch('/api/triage/hospitals')
      .then((response) => response.json())
      .then((result) => {
        const hospital = result.data?.find((item) => (
          item.departments?.some((candidate) => candidate.canAccess)
        ));
        const department = hospital?.departments?.find((candidate) => candidate.canAccess);
        if (!result.success || !hospital || !department) return null;
        const params = new URLSearchParams({
          hospitalId: hospital.id,
          departmentId: department.id,
        });
        return fetch(`/api/triage/stats?${params}`)
          .then((response) => response.json())
          .then((statsResult) => {
            if (statsResult.success) setStats(statsResult.data);
            return null;
          });
      })
      .catch((error) => console.error('Unable to load triage navigation status:', error));

    fetch('/api/auth/me')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to verify your account.');
        setAccount(result.user || null);
      })
      .catch((error) => {
        setAccount(null);
        console.error('Unable to load the navigation account status:', error);
      });
  }, [pathname]);

  useEffect(() => {
    let active = true;
    let storedTheme = null;
    try {
      storedTheme = window.localStorage.getItem('triagex-theme');
    } catch (error) {
      console.error('Unable to read the saved TriageX theme preference:', error);
    }
    const localPreferences = {
      ...DEFAULT_PREFERENCES,
      appearance: ['light', 'dark', 'system'].includes(storedTheme) ? storedTheme : 'system',
    };
    applyPreferencesToDocument(localPreferences);

    fetch('/api/account/preferences')
      .then(async (response) => {
        if (response.status === 401 || response.status === 503) return null;
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load preferences.');
        return result.preferences;
      })
      .then((preferences) => {
        if (active && preferences) applyPreferencesToDocument(preferences);
      })
      .catch((error) => console.error('Unable to load saved appearance preferences:', error));

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      if (document.documentElement.dataset.appearance === 'system') {
        document.documentElement.dataset.theme = systemTheme.matches ? 'dark' : 'light';
        window.dispatchEvent(new Event('triagex-theme-change'));
      }
    };
    systemTheme.addEventListener?.('change', updateSystemTheme);

    return () => {
      active = false;
      systemTheme.removeEventListener?.('change', updateSystemTheme);
    };
  }, []);

  const toggleTheme = async () => {
    const nextDark = !isDark;
    const appearance = nextDark ? 'dark' : 'light';
    if (account) {
      try {
        const response = await fetch('/api/account/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appearance }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to save appearance preference.');
      } catch (error) {
        console.error('Unable to save the TriageX appearance preference:', error);
        return;
      }
    } else {
      try {
        window.localStorage.setItem('triagex-theme', appearance);
      } catch (error) {
        console.error('Unable to save the TriageX theme preference:', error);
      }
    }
    document.documentElement.dataset.appearance = appearance;
    document.documentElement.dataset.theme = appearance;
    window.dispatchEvent(new Event('triagex-theme-change'));
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className={`app-header site-header${pathname === '/' ? ' site-header-home' : ''}`}>
        <Link href="/" className="brand-logo site-brand" aria-label="TriageX home">
          <span className="site-brand-mark" aria-hidden="true">
            <Image src="/triagex-logo.png" alt="" width={38} height={38} />
          </span>
          <span className="site-brand-copy">
            <span className="brand-text">Triage<span>X</span></span>
            <span className="site-brand-tagline">Smart Triage. Better Care.</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                href={href}
                className={`site-nav-link${active ? ' active' : ''}`}
                key={href}
                aria-current={active ? 'page' : undefined}
              >
                {active && <Icon size={14} />}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="site-header-actions">
          <Link href="/dashboard" className="site-clinician-link">
            <Stethoscope size={15} />
            Clinical queue
            {stats?.pendingCount > 0 && <span className="site-queue-count">{stats.pendingCount}</span>}
          </Link>
          {account?.canReviewDoctorApplications && (
            <Link href="/admin/doctor-applications" className="site-clinician-link">
              <ClipboardCheck size={15} />
              Doctor review
            </Link>
          )}
          <Link href={account ? '/settings' : '/login'} className="site-account-link" aria-label={account ? 'Account settings' : 'Sign in'}>
            <UserRound size={16} />
            <span>{account ? 'Settings' : 'Sign in'}</span>
          </Link>
          <button
            type="button"
            className="site-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            aria-pressed={isDark}
            title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link href="/intake" className="site-header-cta">Start Triage <Activity size={16} /></Link>
          <button
            type="button"
            className="site-menu-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="site-mobile-navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav id="site-mobile-navigation" className="site-mobile-nav" aria-label="Mobile navigation">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                href={href}
                className={`site-mobile-link${pathname === href ? ' active' : ''}`}
                key={href}
                onClick={closeMenu}
                aria-current={pathname === href ? 'page' : undefined}
              >
                <Icon size={17} /> {label}
              </Link>
            ))}
            <Link href="/dashboard" className="site-mobile-link" onClick={closeMenu}>
              <Stethoscope size={17} /> Clinical queue
              {stats?.pendingCount > 0 && <span className="site-queue-count">{stats.pendingCount}</span>}
            </Link>
            {account?.canReviewDoctorApplications && (
              <Link href="/admin/doctor-applications" className="site-mobile-link" onClick={closeMenu}>
                <ClipboardCheck size={17} /> Doctor applications
              </Link>
            )}
            <Link href={account ? '/settings' : '/login'} className="site-mobile-link" onClick={closeMenu}>
              <UserRound size={17} /> {account ? 'Account settings' : 'Patient login'}
            </Link>
          </nav>
        )}
      </header>

      {pathname !== '/' && stats?.pendingRedCount > 0 && (
        <div className="emergency-ticker">
          <div className="ticker-content">
            <div className="live-dot" />
            <AlertCircle size={17} />
            <span>
              CLINICIAN QUEUE · {stats.pendingRedCount} Level 1 (RED) {stats.pendingRedCount === 1 ? 'case needs' : 'cases need'} immediate review.
            </span>
          </div>
          <Link href="/dashboard?triageLevel=RED" className="site-emergency-link">
            Open emergency queue <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </>
  );
}
