import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

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
 * Rather than a blind fixed wait, we wait for the app to actually render its destination: both a
 * normal page and the fail-whale render the shell's `#main-content`, and it only mounts once the
 * cold-load has resolved (the redirect fires in the nav guard BEFORE the target route commits). So
 * once `#main-content` is present the URL is final, and we recover if it is /fail-whale - by default a
 * plain `cy.reload()`, which the fail-whale page bounces to home (shell/pages/fail-whale.vue redirects
 * a fresh load with no store error). Callers that must end up on a specific page pass a `reNavigate`
 * callback (e.g. re-probe + re-enter the cluster) instead. Retried a bounded number of times until we
 * land off fail-whale. On the normal path this returns as soon as the page renders - no fixed wait.
 */
Cypress.Commands.add('recoverFromFailWhale', (reNavigate?: () => void, tries = 4) => {
  const attempt = (n: number): void => {
    // Wait for the destination to render (loaded page OR fail-whale both mount #main-content), then
    // check which one it settled on.
    cy.get('#main-content', LONG_TIMEOUT_OPT).should('exist');
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
