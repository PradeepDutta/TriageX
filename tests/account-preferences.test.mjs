import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, normalizePreferences, validatePreferencePatch } from '../lib/account-preferences.js';
import { getSafeRedirectPath } from '../lib/supabase/config.js';

test('validates supported appearance, language, and accessibility settings', () => {
  const result = validatePreferencePatch({
    appearance: 'dark',
    language: 'hi',
    speechLanguage: 'od',
    fontSize: 'large',
    highContrast: true,
    reducedMotion: true,
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.data, {
    appearance: 'dark',
    language: 'hi',
    speechLanguage: 'od',
    fontSize: 'large',
    highContrast: true,
    reducedMotion: true,
  });
});

test('rejects unknown preference fields and unsupported option values', () => {
  assert.equal(validatePreferencePatch({ role: 'admin' }).valid, false);
  assert.equal(validatePreferencePatch({ appearance: 'automatic' }).valid, false);
  assert.equal(validatePreferencePatch({ speechLanguage: 'xx' }).valid, false);
  assert.equal(validatePreferencePatch({ notifications: { emailMe: true } }).valid, false);
});

test('normalizes missing and partial preference rows without losing defaults', () => {
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
  assert.deepEqual(normalizePreferences({
    appearance: 'dark',
    notifications: { appointmentUpdates: true },
  }), {
    ...DEFAULT_PREFERENCES,
    appearance: 'dark',
    notifications: {
      healthReminders: false,
      appointmentUpdates: true,
      triageUpdates: true,
    },
  });
});

test('rejects external and malformed post-login redirect paths', () => {
  assert.equal(getSafeRedirectPath('/settings'), '/settings');
  assert.equal(getSafeRedirectPath('//example.com'), '/settings');
  assert.equal(getSafeRedirectPath('/\\example.com'), '/settings');
  assert.equal(getSafeRedirectPath('https://example.com'), '/settings');
});
