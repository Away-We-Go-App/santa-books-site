export const automaticRateLimitResumeCount = 2;
export const maximumAutomaticRateLimitWait = 65_000;

const defaultRateLimitWait = 60_000;
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export function retryAfterMilliseconds(value, now = Date.now()) {
  if (typeof value !== 'string' || !value.trim()) return defaultRateLimitWait;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1_000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : defaultRateLimitWait;
}

export async function retryRateLimited(operation, options = {}) {
  const pause = options.sleep || sleep;
  const now = options.now || Date.now;
  let resumes = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (error?.status !== 429) throw error;
      const delay = retryAfterMilliseconds(error.retryAfter, now());
      if (resumes >= automaticRateLimitResumeCount || delay > maximumAutomaticRateLimitWait) throw error;
      resumes += 1;
      options.onWait?.(delay);
      await pause(delay);
    }
  }
}
