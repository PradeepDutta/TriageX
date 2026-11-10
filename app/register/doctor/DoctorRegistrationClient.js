'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BadgeCheck, FileText, LockKeyhole, Mail, ShieldCheck,
  Stethoscope, UploadCloud, UserRound,
} from 'lucide-react';

const EMPTY_APPLICATION = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  qualification: '',
  registrationNumber: '',
  specialization: '',
  affiliation: '',
  hospitalId: '',
  departmentId: '',
};

function PasswordField({ value, onChange }) {
  return (
    <div className="doctor-input-wrap">
      <LockKeyhole size={17} aria-hidden="true" />
      <input id="doctor-password" type="password" autoComplete="new-password" value={value} onChange={onChange} minLength={12} maxLength={256} required />
      <label htmlFor="doctor-password">Password</label>
    </div>
  );
}

export default function DoctorRegistrationClient({ authenticated = false, accountEmail = '' }) {
  const router = useRouter();
  const [values, setValues] = useState({ ...EMPTY_APPLICATION, email: accountEmail });
  const [credential, setCredential] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountReady, setAccountReady] = useState(authenticated);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedHospital = useMemo(
    () => facilities.find((hospital) => hospital.id === values.hospitalId),
    [facilities, values.hospitalId]
  );

  useEffect(() => {
    let active = true;
    fetch('/api/doctor/facilities')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load hospital affiliations.');
        return result.data || [];
      })
      .then((data) => {
        if (active) setFacilities(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Unable to load hospital affiliations.');
      })
      .finally(() => {
        if (active) setLoadingFacilities(false);
      });
    return () => { active = false; };
  }, []);

  const setField = (field) => (event) => {
    const value = event.target.value;
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === 'hospitalId' ? { departmentId: '' } : {}),
    }));
    setError('');
  };

  const submitApplication = async () => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key !== 'email' && key !== 'password') formData.set(key, value);
    });
    formData.set('credential', credential);
    const response = await fetch('/api/doctor/applications', { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to submit your application.');
    router.replace('/doctor/application');
    router.refresh();
  };

  const createAccountIfNeeded = async () => {
    if (accountReady) return true;
    if (values.password.length < 12 ||
        !/[a-z]/.test(values.password) ||
        !/[A-Z]/.test(values.password) ||
        !/\d/.test(values.password)) {
      throw new Error('Use at least 12 characters with uppercase, lowercase, and a number.');
    }

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: values.fullName,
        email: values.email,
        password: values.password,
        accountType: 'doctor',
        redirectTo: '/register/doctor',
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to create your account.');
    if (result.confirmationRequired) {
      setAwaitingConfirmation(true);
      setMessage('Verify your email in a separate tab. Your application details and document are still only in this page and have not yet been submitted. After verification, continue here to sign in and submit them.');
      return false;
    }
    setAccountReady(true);
    return true;
  };

  const continueAfterConfirmation = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          remember: false,
          redirectTo: '/register/doctor',
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error('Email or password is incorrect, or email verification is not complete.');
      setAccountReady(true);
      setAwaitingConfirmation(false);
      setMessage('');
      await submitApplication();
    } catch (submitError) {
      setError(submitError.message || 'Unable to continue the doctor application.');
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      if (!credential) throw new Error('Upload a supporting credential document.');
      const ready = await createAccountIfNeeded();
      if (ready) await submitApplication();
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit the doctor application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="doctor-page">
      <section className="doctor-card" aria-labelledby="doctor-registration-title">
        <Link href="/" className="account-brand" aria-label="Return to TriageX home">
          <span><Stethoscope size={23} /></span>
          <strong>TriageX</strong>
          <small>Smart Triage. Better Care.</small>
        </Link>
        <div className="doctor-heading">
          <span className="account-eyebrow"><BadgeCheck size={15} /> CLINICIAN ONBOARDING</span>
          <h1 id="doctor-registration-title">Register as a Doctor</h1>
          <p>Submit your professional details for review. Clinical permissions are granted only after an authorized hospital administrator approves your application.</p>
        </div>

        <div className="doctor-security-note" role="note">
          <ShieldCheck size={19} />
          <span>New registrations remain patient-level accounts. Your credentials are stored in a private bucket and are not verified automatically.</span>
        </div>

        <form className="doctor-form" onSubmit={submit}>
          <fieldset className="doctor-fieldset">
            <legend>Account and contact</legend>
            <label className="doctor-field">
              <span><UserRound size={15} /> Full name</span>
              <input value={values.fullName} onChange={setField('fullName')} autoComplete="name" minLength={2} maxLength={100} required />
            </label>
            {!accountReady && (
              <>
                <label className="doctor-field">
                  <span><Mail size={15} /> Email address</span>
                  <input type="email" value={values.email} onChange={setField('email')} autoComplete="email" maxLength={254} required />
                </label>
                <PasswordField value={values.password} onChange={setField('password')} />
                <small className="doctor-help">Your password is sent only to the existing Supabase Auth flow and is never stored in the application tables.</small>
              </>
            )}
            {accountReady && <p className="doctor-help">Account: {accountEmail || values.email}. This application will be linked to your signed-in account.</p>}
            <label className="doctor-field">
              <span>Phone number</span>
              <input type="tel" value={values.phone} onChange={setField('phone')} autoComplete="tel" minLength={7} maxLength={24} required />
            </label>
          </fieldset>

          <fieldset className="doctor-fieldset">
            <legend>Professional details</legend>
            <label className="doctor-field">
              <span>Medical qualification</span>
              <input value={values.qualification} onChange={setField('qualification')} maxLength={120} required />
            </label>
            <label className="doctor-field">
              <span>Medical registration number</span>
              <input value={values.registrationNumber} onChange={setField('registrationNumber')} maxLength={80} autoComplete="off" required />
            </label>
            <label className="doctor-field">
              <span>Specialization</span>
              <input value={values.specialization} onChange={setField('specialization')} maxLength={100} required />
            </label>
            <label className="doctor-field">
              <span>Hospital or clinic affiliation</span>
              <input value={values.affiliation} onChange={setField('affiliation')} maxLength={200} required />
            </label>
            <label className="doctor-field">
              <span>Requested hospital</span>
              <select value={values.hospitalId} onChange={setField('hospitalId')} required disabled={loadingFacilities || !facilities.length}>
                <option value="">{loadingFacilities ? 'Loading affiliations…' : 'Select an active hospital'}</option>
                {facilities.map((hospital) => <option value={hospital.id} key={hospital.id}>{hospital.name} — {hospital.organizationName}</option>)}
              </select>
            </label>
            <label className="doctor-field">
              <span>Requested department</span>
              <select value={values.departmentId} onChange={setField('departmentId')} required disabled={!selectedHospital}>
                <option value="">Select a department</option>
                {(selectedHospital?.departments || []).map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}
              </select>
            </label>
          </fieldset>

          <label className="doctor-upload" htmlFor="doctor-credential">
            <UploadCloud size={21} />
            <span><strong>Supporting credential document</strong><small>PDF, JPEG or PNG; maximum 5 MB</small></span>
            <input id="doctor-credential" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setCredential(event.target.files?.[0] || null)} required />
            {credential && <span className="doctor-file-name"><FileText size={14} /> {credential.name}</span>}
          </label>

          {error && <p className="account-message account-message-error" role="alert">{error}</p>}
          {message && <p className="account-message account-message-success" role="status">{message}</p>}
          {awaitingConfirmation ? (
            <button type="button" className="account-submit" onClick={continueAfterConfirmation} disabled={submitting}>
              {submitting ? 'Verifying account…' : 'I verified my email — continue'}
              {!submitting && <ArrowRight size={17} />}
            </button>
          ) : (
            <button className="account-submit" type="submit" disabled={submitting || loadingFacilities || !facilities.length}>
              {submitting ? 'Submitting securely…' : 'Submit for review'}
              {!submitting && <ArrowRight size={17} />}
            </button>
          )}
        </form>

        <p className="doctor-terms"><LockKeyhole size={14} /> A pending application does not grant access to hospital records or clinical tools.</p>
        <p className="account-switch">Already applied? <Link href="/doctor/application">Check your application status</Link></p>
        <p className="account-switch">Need an account? <Link href="/login?next=%2Fregister%2Fdoctor">Sign in</Link></p>
      </section>
    </main>
  );
}
