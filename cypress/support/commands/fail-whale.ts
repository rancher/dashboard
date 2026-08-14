/**
 * Recover from the fail-whale error page.
 *
 * [CREATE ISSUE TO INVESTIGATE] The root cause of this whole helper: cold-load GETs (schemas/counts/
 * namespaces during loadCluster, and the management bootstrap) are issued with axios-retry disabled
 * (shell/utils/axios.js configures `axiosRetry(axios, { retries: 0 })`), so a single transient
 * "Network Error" against a momentarily-reconnecting Steve proxy dead-ends at /fail-whale with no
 * retry. Enabling a small retry budget (e.g. `retries: 3` with the default network/idempotent
 * predicate) would let these transient blips recover in-app and remove the need for this test-side
 * recovery entirely - but it is an app behaviour change and needs its own reviewed PR.
 *
 * On a cold cluster/home load a transient backend "Network Error" (a raw connection failure with no
 * HTTP status) trips the navigation guard (shell/config/router/navigation-guards/clusters.js) or the
 * management bootstrap straight to /fail-whale, with no retry. With testIsolation off that state then
 * poisons every remaining test in the spec.
 *
 * This settles briefly (so an in-flight redirect can land), and if we are on /fail-whale, recovers -
 * by default a plain `cy.reload()`, which the fail-whale page bounces to home (shell/pages/fail-whale.vue
 * redirects a fresh load with no store error). Callers that must end up on a specific page pass a
 * `reNavigate` callback (e.g. re-probe + re-enter the cluster) instead. Retried a bounded number of
 * times until we land off fail-whale.
 */
Cypress.Commands.add('recoverFromFailWhale', (reNavigate?: () => void, tries = 4) => {
  const attempt = (n: number): void => {
    cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting -- let an in-flight fail-whale redirect land before checking
    cy.url().then((url) => {
      if (url.includes('/fail-whale') && n < tries) {
        if (reNavigate) {
          reNavigate();
        } else {
          cy.reload();
        }
        attempt(n + 1);
      }
    });
  };

  attempt(0);
});
