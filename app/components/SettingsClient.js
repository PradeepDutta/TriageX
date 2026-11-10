'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Accessibility,
  Bell,
  Check,
  ChevronLeft,
  Eye,
  Globe2,
  KeyRound,
  LoaderCircle,
  LogOut,
  Mic,
  Moon,
  Monitor,
  ShieldCheck,
  Sun,
  Trash2,
} from 'lucide-react';
import { DEFAULT_PREFERENCES, normalizePreferences, SUPPORTED_LANGUAGES } from '@/lib/account-preferences';
import { applyPreferencesToDocument } from '@/lib/appearance';
import Navbar from './Navbar';

const SECTIONS = [
  { id: 'appearance', title: 'Appearance', subtitle: 'Choose how TriageX looks on this device.', icon: Monitor },
  { id: 'language', title: 'Language', subtitle: 'Set your preferred display and voice-input language.', icon: Globe2 },
  { id: 'notifications', title: 'Notifications', subtitle: 'Save notification preferences for your account.', icon: Bell },
  { id: 'privacy', title: 'Privacy & security', subtitle: 'Manage your password, account sessions, and data requests.', icon: ShieldCheck },
  { id: 'accessibility', title: 'Accessibility', subtitle: 'Adjust text presentation, contrast, and motion.', icon: Accessibility },
  { id: 'voice', title: 'Voice preferences', subtitle: 'Select a voice language and check microphone permission.', icon: Mic },
];

export default function SettingsClient({ email, role }) {
  const router = useRouter();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [microphoneStatus, setMicrophoneStatus] = useState('Checking permission…');
  const [privacyRequest, setPrivacyRequest] = useState(null);
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [deletionBusy, setDeletionBusy] = useState(false);

  useEffect(() => {
    let active = true;
    let microphonePermission = null;
    let microphonePermissionUpdate = null;
    fetch('/api/account/preferences')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load preferences.');
        return result.preferences;
      })
      .then((value) => {
        if (!active) return;
        const next = normalizePreferences(value);
        setPreferences(next);
        applyPreferencesToDocument(next);
        setLoaded(true);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message);
        setLoaded(true);
      });

    fetch('/api/account/privacy')
      .then(async (response) => {
        if (response.status === 503) return null;
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load privacy request status.');
        return result.request;
      })
      .then((request) => { if (active && request) setPrivacyRequest(request); })
      .catch((privacyError) => console.error('Unable to load account privacy status:', privacyError));

    if (!navigator.permissions?.query) {
      Promise.resolve().then(() => {
        if (active) setMicrophoneStatus('Browser reports permission when voice input is started.');
      });
    } else {
      navigator.permissions.query({ name: 'microphone' })
        .then((permission) => {
          if (!active) return;
          microphonePermission = permission;
          const update = () => setMicrophoneStatus({
            granted: 'Allowed by this browser',
            denied: 'Blocked in browser settings',
            prompt: 'Not requested; permission is asked only when voice input starts',
          }[permission.state] || 'Status unavailable');
          microphonePermissionUpdate = update;
          update();
          permission.addEventListener?.('change', update);
        })
        .catch(() => setMicrophoneStatus('Status unavailable; browser may report permission when voice input starts.'));
    }

    return () => {
      active = false;
      if (microphonePermission && microphonePermissionUpdate) {
        microphonePermission.removeEventListener?.('change', microphonePermissionUpdate);
      }
    };
  }, []);

  const save = async (patch, message = 'Preferences saved to your account.') => {
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const response = await fetch('/api/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save preferences.');
      const next = normalizePreferences(result.preferences);
      setPreferences(next);
      applyPreferencesToDocument(next);
      setNotice(message);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password.newPassword !== password.confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: password.currentPassword, newPassword: password.newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update password.');
      setNotice(result.message);
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (passwordError) {
      setError(passwordError.message);
    } finally {
      setPasswordBusy(false);
    }
  };

  const signOutEverywhere = async () => {
    setLogoutBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to end sessions.');
      router.replace('/login');
      router.refresh();
    } catch (logoutError) {
      setError(logoutError.message);
      setLogoutBusy(false);
    }
  };

  const requestDeletion = async () => {
    if (!window.confirm('Submit an account deletion request for administrator review? This will not immediately delete your account.')) return;
    setDeletionBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/account/privacy', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit your request.');
      setPrivacyRequest({ status: 'submitted' });
      setNotice(result.message || 'An account deletion request is already in review.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletionBusy(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="settings-page">
        <div className="settings-heading">
          <Link href="/" className="settings-back"><ChevronLeft size={16} /> Back to TriageX</Link>
          <span className="account-eyebrow"><ShieldCheck size={14} /> PERSONAL ACCOUNT</span>
          <h1>Settings & preferences</h1>
          <p>Manage your account and accessibility preferences. Changes are saved securely to your account.</p>
        </div>

        <div className="settings-account-bar">
          <div className="settings-avatar" aria-hidden="true">{email.slice(0, 1).toUpperCase()}</div>
          <div><strong>{email}</strong><span>{role === 'patient' ? 'Patient account' : role === 'clinician' ? 'Clinician account' : 'Administrator account'}</span></div>
          <span className="settings-secure-chip"><ShieldCheck size={14} /> Account protected</span>
        </div>

        {error && <p className="account-message account-message-error" role="alert">{error}</p>}
        {notice && <p className="account-message account-message-success" role="status"><Check size={15} /> {notice}</p>}
        {!loaded && <p className="settings-loading"><LoaderCircle size={18} className="spin" /> Loading account preferences…</p>}

        <div className="settings-layout">
          <nav className="settings-index" aria-label="Settings sections">
            {SECTIONS.map(({ id, title, icon: Icon }) => (
              <a key={id} href={`#settings-${id}`}><Icon size={16} /> {title}</a>
            ))}
          </nav>

          <div className="settings-sections">
            <section id="settings-appearance" className="settings-card">
              <div className="settings-card-heading"><span><Monitor size={19} /></span><div><h2>Appearance</h2><p>Choose your preferred color theme.</p></div></div>
              <div className="settings-choice-row" role="group" aria-label="Appearance theme">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" className={`settings-choice${preferences.appearance === value ? ' selected' : ''}`} aria-pressed={preferences.appearance === value} disabled={!loaded || saving} onClick={() => save({ appearance: value })}>
                    <Icon size={18} /> {label}
                  </button>
                ))}
              </div>
            </section>

            <section id="settings-language" className="settings-card">
              <div className="settings-card-heading"><span><Globe2 size={19} /></span><div><h2>Language</h2><p>The app interface is currently available in English; this preference is saved for supported voice input.</p></div></div>
              <label className="settings-field" htmlFor="account-language">Preferred language</label>
              <select id="account-language" className="settings-select" value={preferences.language} disabled={!loaded || saving} onChange={(event) => save({ language: event.target.value })}>
                {SUPPORTED_LANGUAGES.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}
              </select>
            </section>

            <section id="settings-notifications" className="settings-card">
              <div className="settings-card-heading"><span><Bell size={19} /></span><div><h2>Notifications</h2><p>Saved preferences only. Email, SMS, and push delivery are not configured in this project.</p></div></div>
              {[
                ['healthReminders', 'Health reminders', 'General reminders about health information you choose to review.'],
                ['appointmentUpdates', 'Appointment notifications', 'Appointment reminders are not connected to a scheduling service.'],
                ['triageUpdates', 'Triage updates', 'Updates are not sent automatically; check the assessment page for current status.'],
              ].map(([key, title, description]) => (
                <label key={key} className="settings-switch-row">
                  <span><strong>{title}</strong><small>{description}</small></span>
                  <input type="checkbox" checked={preferences.notifications[key]} disabled={!loaded || saving} onChange={(event) => save({ notifications: { [key]: event.target.checked } })} />
                </label>
              ))}
            </section>

            <section id="settings-privacy" className="settings-card">
              <div className="settings-card-heading"><span><ShieldCheck size={19} /></span><div><h2>Privacy & security</h2><p>Review and manage access to your account.</p></div></div>
              <form className="settings-password-form" onSubmit={changePassword}>
                <h3><KeyRound size={16} /> Change password</h3>
                <label className="settings-field" htmlFor="current-password">Current password</label>
                <input id="current-password" className="settings-input" type="password" autoComplete="current-password" value={password.currentPassword} onChange={(event) => setPassword((current) => ({ ...current, currentPassword: event.target.value }))} required />
                <div className="settings-password-grid">
                  <div><label className="settings-field" htmlFor="new-password">New password</label><input id="new-password" className="settings-input" type="password" minLength={12} autoComplete="new-password" value={password.newPassword} onChange={(event) => setPassword((current) => ({ ...current, newPassword: event.target.value }))} required /></div>
                  <div><label className="settings-field" htmlFor="confirm-new-password">Confirm new password</label><input id="confirm-new-password" className="settings-input" type="password" minLength={12} autoComplete="new-password" value={password.confirmPassword} onChange={(event) => setPassword((current) => ({ ...current, confirmPassword: event.target.value }))} required /></div>
                </div>
                <small className="account-field-hint">At least 12 characters with uppercase, lowercase, and a number.</small>
                <button className="settings-secondary-button" type="submit" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Update password'}</button>
              </form>

              <div className="settings-security-action">
                <span><strong>Active sessions</strong><small>Sign out this account on all devices. You will need to sign in again.</small></span>
                <button type="button" className="settings-secondary-button" onClick={signOutEverywhere} disabled={logoutBusy}><LogOut size={15} /> {logoutBusy ? 'Signing out…' : 'Sign out all devices'}</button>
              </div>

              <div className="settings-security-action settings-danger-action">
                <span><strong>Account deletion request</strong><small>{privacyRequest ? 'A deletion request is pending administrator review. Account deletion is not automatic.' : 'Submit a request for administrator review; this does not immediately delete your account.'}</small></span>
                <button type="button" className="settings-danger-button" onClick={requestDeletion} disabled={deletionBusy || Boolean(privacyRequest)}><Trash2 size={15} /> {deletionBusy ? 'Submitting…' : privacyRequest ? 'Request pending' : 'Request deletion'}</button>
              </div>
            </section>

            <section id="settings-accessibility" className="settings-card">
              <div className="settings-card-heading"><span><Accessibility size={19} /></span><div><h2>Accessibility</h2><p>Adjust visual settings for this account.</p></div></div>
              <label className="settings-switch-row">
                <span><strong>Text size</strong><small>Use larger text throughout supported TriageX pages.</small></span>
                <select className="settings-inline-select" value={preferences.fontSize} disabled={!loaded || saving} onChange={(event) => save({ fontSize: event.target.value })} aria-label="Text size">
                  <option value="standard">Standard</option><option value="large">Large</option>
                </select>
              </label>
              <label className="settings-switch-row"><span><strong>High contrast</strong><small>Strengthen interface text, borders, and focus indicators.</small></span><input type="checkbox" checked={preferences.highContrast} disabled={!loaded || saving} onChange={(event) => save({ highContrast: event.target.checked })} /></label>
              <label className="settings-switch-row"><span><strong>Reduce motion</strong><small>Minimize nonessential animations and transitions.</small></span><input type="checkbox" checked={preferences.reducedMotion} disabled={!loaded || saving} onChange={(event) => save({ reducedMotion: event.target.checked })} /></label>
            </section>

            <section id="settings-voice" className="settings-card">
              <div className="settings-card-heading"><span><Mic size={19} /></span><div><h2>Voice preferences</h2><p>Speech input uses the browser Web Speech API when available.</p></div></div>
              <label className="settings-field" htmlFor="speech-language">Preferred speech input language</label>
              <select id="speech-language" className="settings-select" value={preferences.speechLanguage} disabled={!loaded || saving} onChange={(event) => save({ speechLanguage: event.target.value })}>
                {SUPPORTED_LANGUAGES.map(({ code, name, speechLocale }) => <option key={code} value={code}>{name} ({speechLocale})</option>)}
              </select>
              <div className="settings-microphone-status"><Mic size={16} /><span><strong>Microphone permission</strong><small>{microphoneStatus}</small></span></div>
              <p className="settings-microphone-note"><Eye size={14} /> TriageX does not request microphone access from this settings page.</p>
            </section>
          </div>
        </div>

        <p className="settings-footer-note"><ShieldCheck size={15} /> Preferences are account-scoped and protected by database row-level security.</p>
      </main>
    </>
  );
}
