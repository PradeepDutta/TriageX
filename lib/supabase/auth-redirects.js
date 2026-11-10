import { getSafeRedirectPath } from './config.js';

export function getPostLoginRedirect(profileRole, doctorStatus, requestedPath) {
  if (['clinician', 'admin'].includes(profileRole)) return '/dashboard';
  if (doctorStatus === 'approved') return '/doctor/dashboard';
  if (['pending', 'rejected', 'suspended'].includes(doctorStatus)) return '/doctor/application';
  return getSafeRedirectPath(requestedPath);
}
