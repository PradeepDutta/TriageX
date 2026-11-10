'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ExternalLink, FileText, RefreshCw, ShieldAlert } from 'lucide-react';

export default function DoctorApplicationsClient() {
  const [applications, setApplications] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [signedLinks, setSignedLinks] = useState({});
  const [reasons, setReasons] = useState({});
  const [departments, setDepartments] = useState({});
  const [busyUserId, setBusyUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const facilityMap = useMemo(() => new Map(facilities.map((hospital) => [hospital.id, hospital])), [facilities]);
  const visibleApplications = statusFilter === 'all'
    ? applications
    : applications.filter((application) => application.status === statusFilter);

  const fetchData = useCallback(async () => {
    const [applicationsResponse, facilitiesResponse] = await Promise.all([
      fetch('/api/admin/doctor-applications'),
      fetch('/api/doctor/facilities'),
    ]);
    const [applicationResult, facilityResult] = await Promise.all([
      applicationsResponse.json(),
      facilitiesResponse.json(),
    ]);
    if (!applicationsResponse.ok) throw new Error(applicationResult.error || 'Unable to load applications.');
    if (!facilitiesResponse.ok) throw new Error(facilityResult.error || 'Unable to load hospital departments.');
    return {
      applications: applicationResult.data || [],
      facilities: facilityResult.data || [],
    };
  }, []);

  const applyData = useCallback((data) => {
    setApplications(data.applications);
    setFacilities(data.facilities);
    setDepartments((current) => {
      const next = { ...current };
      for (const application of data.applications) {
        next[application.userId] ||= application.assignedDepartmentId || application.requestedDepartmentId;
      }
      return next;
    });
  }, []);

  const load = async () => {
    try {
      applyData(await fetchData());
    } catch (loadError) {
      setError(loadError.message || 'Unable to load doctor applications.');
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (active) applyData(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Unable to load doctor applications.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [applyData, fetchData]);

  const refresh = () => {
    setError('');
    setLoading(true);
    load();
  };

  const openCredential = async (userId) => {
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/admin/doctor-applications/${userId}/document`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to access this credential.');
      setSignedLinks((current) => ({ ...current, [userId]: result.url }));
    } catch (linkError) {
      setError(linkError.message || 'Unable to access this credential.');
    }
  };

  const review = async (application, decision) => {
    setBusyUserId(application.userId);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/doctor-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: application.userId,
          decision,
          reason: reasons[application.userId] || '',
          departmentId: departments[application.userId],
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to apply this decision.');
      setMessage(`Application ${result.status}. The decision and reviewer have been recorded.`);
      await load();
    } catch (reviewError) {
      setError(reviewError.message || 'Unable to apply this decision.');
    } finally {
      setBusyUserId('');
    }
  };

  return (
    <main className="doctor-admin-page">
      <header className="doctor-admin-header">
        <div><span className="account-eyebrow"><ShieldAlert size={15} /> AUTHORIZED REVIEWERS</span><h1>Doctor applications</h1><p>Review submitted credentials and assign access only to the requested hospital.</p></div>
        <div className="doctor-admin-controls">
          <label className="doctor-filter"><span>Show</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option><option value="all">All</option></select></label>
          <button type="button" className="doctor-refresh-button" onClick={refresh} disabled={loading}><RefreshCw size={16} /> Refresh</button>
        </div>
      </header>
      {error && <p className="account-message account-message-error" role="alert">{error}</p>}
      {message && <p className="account-message account-message-success" role="status">{message}</p>}
      {loading && <div className="doctor-empty-state">Loading applications…</div>}
      {!loading && !error && visibleApplications.length === 0 && <div className="doctor-empty-state">There are no {statusFilter === 'all' ? '' : `${statusFilter} `}applications visible to your authorized hospital assignments.</div>}
      <section className="doctor-application-list" aria-label="Doctor applications">
        {visibleApplications.map((application) => {
          const hospital = facilityMap.get(application.requestedHospitalId);
          const allowedDepartments = hospital?.departments || [];
          const pending = application.status === 'pending';
          const approved = application.status === 'approved';
          return (
            <article className="doctor-review-card" key={application.userId}>
              <div className="doctor-review-top">
                <div><span className={`doctor-pill doctor-pill-${application.status}`}>{application.status}</span><h2>{application.fullName}</h2><p>{application.email} · {application.phone}</p></div>
                <span className="doctor-review-date">Submitted {new Date(application.submittedAt).toLocaleDateString()}</span>
              </div>
              <dl className="doctor-review-details">
                <div><dt>Qualification</dt><dd>{application.qualification}</dd></div>
                <div><dt>Registration number</dt><dd>{application.registrationNumber}</dd></div>
                <div><dt>Specialization</dt><dd>{application.specialization}</dd></div>
                <div><dt>Affiliation</dt><dd>{application.affiliation}</dd></div>
                <div><dt>Requested hospital</dt><dd>{application.requestedHospital}</dd></div>
                <div><dt>Requested department</dt><dd>{application.requestedDepartment}</dd></div>
              </dl>
              <div className="doctor-review-document">
                <button type="button" className="doctor-outline-button" onClick={() => openCredential(application.userId)}><FileText size={16} /> Review credential</button>
                {signedLinks[application.userId] && <a className="doctor-secondary-link" href={signedLinks[application.userId]} target="_blank" rel="noreferrer">Open private document <ExternalLink size={14} /><small> Link expires in 60 seconds.</small></a>}
              </div>
              {application.decisionNote && <div className="doctor-review-note"><strong>Review note</strong><p>{application.decisionNote}</p></div>}
              {pending && (
                <div className="doctor-review-actions">
                  <label className="doctor-field"><span>Assign department</span>
                    <select value={departments[application.userId] || ''} onChange={(event) => setDepartments((current) => ({ ...current, [application.userId]: event.target.value }))} required>
                      <option value="">Select an active department</option>
                      {allowedDepartments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}
                    </select>
                  </label>
                  <label className="doctor-field"><span>Reviewer note / rejection reason</span>
                    <textarea value={reasons[application.userId] || ''} onChange={(event) => setReasons((current) => ({ ...current, [application.userId]: event.target.value }))} maxLength={1000} rows={2} placeholder="A reason is required when rejecting." />
                  </label>
                  <div className="doctor-review-buttons">
                    <button type="button" className="doctor-approve-button" onClick={() => review(application, 'approve')} disabled={busyUserId === application.userId || !departments[application.userId]}><BadgeCheck size={16} /> Approve</button>
                    <button type="button" className="doctor-reject-button" onClick={() => review(application, 'reject')} disabled={busyUserId === application.userId || (reasons[application.userId] || '').trim().length < 3}>Reject</button>
                  </div>
                </div>
              )}
              {approved && <div className="doctor-review-actions"><label className="doctor-field"><span>Suspension reason</span><textarea value={reasons[application.userId] || ''} onChange={(event) => setReasons((current) => ({ ...current, [application.userId]: event.target.value }))} maxLength={1000} rows={2} /></label><button type="button" className="doctor-reject-button" onClick={() => review(application, 'suspend')} disabled={busyUserId === application.userId || (reasons[application.userId] || '').trim().length < 3}>Suspend doctor access</button></div>}
            </article>
          );
        })}
      </section>
    </main>
  );
}
