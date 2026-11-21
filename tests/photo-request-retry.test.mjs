import test from 'node:test';
import assert from 'node:assert/strict';
import { maximumAutomaticRateLimitWait, retryAfterMilliseconds, retryRateLimited } from '../public/photos/retry.mjs';

const rateLimitError = retryAfter => Object.assign(new Error('rate limited'), { status: 429, retryAfter });

test('uses the relay Retry-After delay in seconds', () => {
  assert.equal(retryAfterMilliseconds('0'), 0);
  const now = Date.parse('2026-12-24T12:00:00Z');
  const actualRelayDelay = retryAfterMilliseconds('60', now);
  assert.equal(actualRelayDelay, 60_000);
  assert.equal(actualRelayDelay <= maximumAutomaticRateLimitWait, true);
});

test('uses an HTTP-date Retry-After relative to the supplied clock', () => {
  const now = Date.parse('2026-12-24T12:00:00Z');
  assert.equal(retryAfterMilliseconds('Thu, 24 Dec 2026 12:00:09 GMT', now), 9_000);
  assert.equal(retryAfterMilliseconds('Thu, 24 Dec 2026 11:59:59 GMT', now), 0);
});

test('uses the relay window when Retry-After is unavailable to older clients', () => {
  assert.equal(retryAfterMilliseconds(null), 60_000);
  assert.equal(retryAfterMilliseconds('not-a-delay'), 60_000);
});

test('resumes after the actual relay wait without sleeping the test clock', async () => {
  let now = Date.parse('2026-12-24T12:00:00Z');
  let attempts = 0;
  const waits = [];
  const result = await retryRateLimited(async () => {
    attempts += 1;
    if (attempts === 1) throw rateLimitError('60');
    return 'uploaded';
  }, {
    now: () => now,
    sleep: async delay => { waits.push(delay); now += delay; }
  });
  assert.equal(result, 'uploaded');
  assert.equal(attempts, 2);
  assert.deepEqual(waits, [60_000]);
  assert.equal(now, Date.parse('2026-12-24T12:01:00Z'));
});

test('bounds consecutive waits but resets after each successful photo', async () => {
  const waits = [];
  for (let photo = 0; photo < 4; photo += 1) {
    let attempts = 0;
    await retryRateLimited(async () => {
      attempts += 1;
      if (attempts === 1) throw rateLimitError('60');
      return 'uploaded';
    }, { sleep: async delay => waits.push(delay) });
    assert.equal(attempts, 2);
  }
  assert.deepEqual(waits, [60_000, 60_000, 60_000, 60_000]);

  let attempts = 0;
  await assert.rejects(retryRateLimited(async () => {
    attempts += 1;
    throw rateLimitError('60');
  }, { sleep: async () => {} }), error => error.status === 429);
  assert.equal(attempts, 3);
});
