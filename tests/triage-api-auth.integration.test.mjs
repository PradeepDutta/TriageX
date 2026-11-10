import test from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = process.env.TRIAGEX_TEST_API_BASE_URL?.replace(/\/+$/, '');

test('anonymous requests cannot access clinical triage APIs', {
  skip: !baseUrl && 'Set TRIAGEX_TEST_API_BASE_URL to a local app configured with disposable Supabase credentials.',
}, async () => {
  const requests = [
    ['GET', '/api/triage/hospitals'],
    ['GET', '/api/triage/stats'],
    ['GET', '/api/triage/queue'],
    ['GET', '/api/triage/patient/TRG-1861'],
    ['PATCH', '/api/triage/review/TRG-1861'],
    ['POST', '/api/triage/simulate'],
    ['POST', '/api/triage/intake'],
    ['POST', '/api/triage/translate'],
  ];

  for (const [method, path] of requests) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: method === 'PATCH' ? { 'content-type': 'application/json' } : undefined,
      body: method === 'PATCH' ? '{}' : undefined,
      redirect: 'manual',
    });
    assert.equal(response.status, 401, `${method} ${path} should require authentication`);
  }
});
