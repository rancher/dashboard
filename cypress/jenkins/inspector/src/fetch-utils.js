/**
 * Strips sensitive infrastructure URLs from text before it is sent to external
 * services (AI API, GitHub issues). Replaces only the Rancher instance hostname
 * with a placeholder, preserving the path for debugging purposes.
 *
 * e.g. https://jnkui-abc-123/v1/fleet.cattle.io.gitrepos
 *   →  https://hostname/v1/fleet.cattle.io.gitrepos
 *
 * @param {string} text
 * @returns {string}
 */
export function sanitizeText(text) {
  if (!text) return text;

  return text
    .replace(/https?:\/\/[^\s"'<>)/]+\.rancher\.space/g, 'https://hostname')
    .replace(/https?:\/\/[^\s"'<>)/]+\.rancher\.qa/g, 'https://hostname');
}

/**
 * fetchWithRetry — wraps fetch with an AbortController timeout and retry logic.
 * Retries on 5xx responses and connection resets (up to `retries` times).
 *
 * @param {string} url
 * @param {RequestInit} options
 * @param {{ timeoutMs?: number, retries?: number }} config
 */
export async function fetchWithRetry(url, options = {}, { timeoutMs = 45_000, retries = 2 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });

      if (res.status >= 500 && attempt < retries) {
        lastError = new Error(`HTTP ${ res.status }: ${ url }`);
        continue;
      }

      return res;
    } catch (e) {
      const isRetryable = e.name === 'AbortError' || e.name === 'TypeError';

      lastError = e.name === 'AbortError' ? new Error(`Request timed out after ${ timeoutMs }ms: ${ url }`) : e;

      if (!isRetryable || attempt >= retries) throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}
