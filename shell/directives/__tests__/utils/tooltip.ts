const POLL_INTERVAL = 20;
const DEFAULT_TIMEOUT = 8000;

/**
 * Waits for a condition to hold, polling until it does.
 *
 * The tooltip directive hands its show and hide to floating-vue, which spreads the work over a
 * theme delay, a Vue render and an awaited positioning pass. A fixed wait long enough on a quiet
 * machine is not long enough on a loaded CI runner, so the tests wait for the outcome instead of
 * for a duration.
 * @param {Function} condition Returns true once the tests can continue.
 * @param {number} timeout How long to keep polling before giving up.
 * @returns {Promise<void>} Resolves when the condition holds, or when the timeout expires.
 */
export async function waitUntil(condition: () => boolean, timeout = DEFAULT_TIMEOUT): Promise<void> {
  const deadline = Date.now() + timeout;

  while (!condition() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

/**
 * Waits for the tooltip popper to be shown.
 * @param {number} timeout How long to keep polling before giving up.
 * @returns {Promise<void>} Resolves once a shown popper is in the document.
 */
export function waitForTooltip(timeout?: number): Promise<void> {
  return waitUntil(() => !!document.querySelector('.v-popper__popper--shown'), timeout);
}

/**
 * Waits for the tooltip popper to be hidden.
 * @param {number} timeout How long to keep polling before giving up.
 * @returns {Promise<void>} Resolves once no shown popper is in the document.
 */
export function waitForNoTooltip(timeout?: number): Promise<void> {
  return waitUntil(() => !document.querySelector('.v-popper__popper--shown'), timeout);
}

/**
 * Waits for an element's aria-describedby to point at something other than the given id, which is
 * how floating-vue signals that it has taken the description over or handed it back.
 * @param {Element} el The tooltip trigger.
 * @param {string | null} id The id the attribute currently holds.
 * @param {number} timeout How long to keep polling before giving up.
 * @returns {Promise<void>} Resolves once the attribute changes.
 */
export function waitForDescribedByChange(el: Element, id: string | null, timeout?: number): Promise<void> {
  return waitUntil(() => el.getAttribute('aria-describedby') !== id, timeout);
}
