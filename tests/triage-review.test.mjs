import test from 'node:test';
import assert from 'node:assert/strict';
import { createTriageReviewPayload } from '../lib/triage-review.js';

test('review attribution comes from the authenticated actor, not request data', () => {
  const payload = createTriageReviewPayload({
    reviewedBy: 'Dr. Someone Else',
    triageLevel: 'red',
    doctorNotes: 'Reviewed',
  }, 'verified-auth-user-id');

  assert.equal(payload.reviewedBy, 'verified-auth-user-id');
  assert.equal(payload.triageLevel, 'RED');
});
