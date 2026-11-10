import test from 'node:test';
import assert from 'node:assert/strict';
import { getPostLoginRedirect } from '../lib/supabase/auth-redirects.js';

test('approved doctors are directed to the doctor dashboard', () => {
  assert.equal(getPostLoginRedirect('patient', 'approved', '/settings'), '/doctor/dashboard');
});

test('pending, rejected, and suspended applicants are directed to application status', () => {
  for (const status of ['pending', 'rejected', 'suspended']) {
    assert.equal(getPostLoginRedirect('patient', status, '/dashboard'), '/doctor/application');
  }
});

test('legacy staff profile redirects are preserved without inferring tenant access', () => {
  assert.equal(getPostLoginRedirect('clinician', null, '/settings'), '/dashboard');
  assert.equal(getPostLoginRedirect('admin', 'pending', '/settings'), '/dashboard');
});

test('patient redirects remain same-origin and safe', () => {
  assert.equal(getPostLoginRedirect('patient', null, '/doctor/application'), '/doctor/application');
  assert.equal(getPostLoginRedirect('patient', null, '//external.example'), '/settings');
});
