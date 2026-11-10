'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';

const COPY = {
  login: {
    eyebrow: 'WELCOME BACK',
    title: 'Sign in to TriageX',
    description: 'Access your account and saved preferences securely.',
    endpoint: '/api/auth/login',
    submit: 'Sign in',
  },
  register: {
    eyebrow: 'PATIENT ACCOUNT',
    title: 'Create your account',
    description: 'Set up a patient account to manage your TriageX preferences.',
    endpoint: '/api/auth/register',
    submit: 'Create patient account',
  },
  forgot: {
    eyebrow: 'ACCOUNT RECOVERY',
    title: 'Reset your password',
    description: 'We will send a secure recovery link if an account exists for the email you enter.',
    endpoint: '/api/auth/forgot-password',
    submit: 'Send recovery link',
  },
  reset: {
    eyebrow: 'ACCOUNT RECOVERY',
    title: 'Choose a new password',
    description: 'Create a strong password for your TriageX account.',
    endpoint: '/api/auth/password/reset',
    submit: 'Update password',
  },
};

function PasswordInput({ id, label, value, onChange, visible, onToggle, autoComplete }) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="account-input-wrap">
      <LockKeyhole size={17} aria-hidden="true" />
      <input
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder=" "
        autoComplete={autoComplete}
        aria-label={label}
        required
      />
      <label htmlFor={id}>{label}</label>
      <button type="button" className="account-password-toggle" onClick={onToggle} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}>
        <Icon size={17} />
      </button>
    </div>
  );
}

export default function AuthForm({ mode }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [values, setValues] = useState({ displayName: '', email: '', password: '', confirmPassword: '', currentPassword: '' });
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    process.env.NEXT_PUBLIC_SITE_URL
  );

  const setField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!configured) {
      setError('Account access is not configured yet. Ask the site administrator to connect Supabase.');
      return;
    }

    if (['register', 'reset'].includes(mode)) {
      if (values.password.length < 12 || !/[a-z]/.test(values.password) || !/[A-Z]/.test(values.password) || !/\d/.test(values.password)) {
        setError('Use at least 12 characters with an uppercase letter, a lowercase letter, and a number.');
        return;
      }
      if (values.password !== values.confirmPassword) {
        setError('The passwords do not match.');
        return;
      }
    }

    setPending(true);
    try {
      const payload = mode === 'login'
        ? { email: values.email, password: values.password, remember, redirectTo: new URLSearchParams(window.location.search).get('next') }
        : mode === 'register'
          ? { displayName: values.displayName, email: values.email, password: values.password }
          : mode === 'reset'
            ? { newPassword: values.password }
            : { email: values.email };
      const response = await fetch(copy.endpoint, {
        method: mode === 'reset' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to complete this request.');

      if (mode === 'login') {
        router.replace(result.redirectTo);
        router.refresh();
      } else if (mode === 'reset') {
        setSuccess(result.message);
        window.setTimeout(() => router.replace('/login'), 900);
      } else {
        setSuccess(result.message);
      }
    } catch (submitError) {
      setError(submitError.message || 'Unable to complete this request.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="account-title">
        <Link href="/" className="account-brand" aria-label="Return to TriageX home">
          <span><Image src="/triagex-logo.png" alt="" width={42} height={42} /></span>
          <strong>TriageX</strong>
          <small>Smart Triage. Better Care.</small>
        </Link>

        <div className="account-heading">
          <span className="account-eyebrow"><Activity size={14} /> {copy.eyebrow}</span>
          <h1 id="account-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </div>

        {!configured && (
          <div className="account-notice account-notice-warning" role="status">
            Supabase is not configured. Authentication is disabled until the administrator adds the required environment variables and database migration.
          </div>
        )}

        {mode === 'register' && (
          <div className="account-notice" role="note">
            Registration creates a patient account only. Clinician and staff access must be assigned by an administrator.
          </div>
        )}

        <form className="account-form" onSubmit={submit} noValidate>
          {mode === 'register' && (
            <div className="account-input-wrap">
              <UserRound size={17} aria-hidden="true" />
              <input id="displayName" name="displayName" type="text" value={values.displayName} onChange={setField('displayName')} placeholder=" " autoComplete="name" minLength={2} maxLength={100} required />
              <label htmlFor="displayName">Full name</label>
            </div>
          )}

          {mode !== 'reset' && (
            <div className="account-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input id="email" name="email" type="email" value={values.email} onChange={setField('email')} placeholder=" " autoComplete="email" maxLength={254} required />
              <label htmlFor="email">Email address</label>
            </div>
          )}

          {mode === 'login' && (
            <>
              <PasswordInput
                id="password"
                label="Password"
                value={values.password}
                onChange={setField('password')}
                visible={visible}
                onToggle={() => setVisible((current) => !current)}
                autoComplete="current-password"
              />
              <div className="account-form-options">
                <label className="account-check"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Keep me signed in for 30 days</label>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            </>
          )}

          {mode === 'reset' && (
            <>
              <PasswordInput
                id="password"
                label="New password"
                value={values.password}
                onChange={setField('password')}
                visible={visible}
                onToggle={() => setVisible((current) => !current)}
                autoComplete="new-password"
              />
              <PasswordInput
                id="confirmPassword"
                label="Confirm new password"
                value={values.confirmPassword}
                onChange={setField('confirmPassword')}
                visible={visible}
                onToggle={() => setVisible((current) => !current)}
                autoComplete="new-password"
              />
            </>
          )}

          {mode === 'register' && (
            <>
              <PasswordInput
                id="password"
                label="Password"
                value={values.password}
                onChange={setField('password')}
                visible={visible}
                onToggle={() => setVisible((current) => !current)}
                autoComplete="new-password"
              />
              <PasswordInput
                id="confirmPassword"
                label="Confirm password"
                value={values.confirmPassword}
                onChange={setField('confirmPassword')}
                visible={visible}
                onToggle={() => setVisible((current) => !current)}
                autoComplete="new-password"
              />
              <small className="account-field-hint">At least 12 characters, including uppercase, lowercase, and a number.</small>
            </>
          )}

          {error && <p className="account-message account-message-error" role="alert">{error}</p>}
          {success && <p className="account-message account-message-success" role="status">{success}</p>}

          <button className="account-submit" type="submit" disabled={pending || !configured}>
            {pending ? 'Please wait…' : copy.submit}
            {!pending && <ArrowRight size={17} />}
          </button>
        </form>

        {mode === 'login' && (
          <>
            <p className="account-switch">New to TriageX? <Link href="/register">Create a patient account</Link></p>
            <p className="account-switch">Clinician? <Link href="/register/doctor">Register as a Doctor</Link></p>
          </>
        )}
        {mode === 'register' && (
          <>
            <p className="account-switch">Clinician? <Link href="/register/doctor">Register as a Doctor</Link></p>
            <p className="account-switch">Already registered? <Link href="/login">Sign in</Link></p>
          </>
        )}
        {mode === 'forgot' && (
          <p className="account-switch"><Link href="/login"><ArrowLeft size={14} /> Back to sign in</Link></p>
        )}
        {mode === 'reset' && (
          <p className="account-switch"><ShieldCheck size={14} /> Password recovery links expire and can be used once.</p>
        )}
      </section>

      <p className="account-safety"><ShieldCheck size={15} /> TriageX will never ask you to share health details on this account form.</p>
    </main>
  );
}
