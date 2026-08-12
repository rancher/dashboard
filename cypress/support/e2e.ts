import 'cypress-real-events/support';
import '@cypress/code-coverage/support';
import './commands/commands';
import './commands/chainable';
import './commands/rancher-api-commands';
import './commands/accessiblity';

import { CypressFailedAttempt } from './utils/retry-logging';
import 'cypress-mochawesome-reporter/register';
import '@percy/cypress';
import 'cypress-axe';
const { addCustomCommand } = require('cypress-delete-downloads-folder');
// @cypress/grep v6 renamed the support export to `register` and is exports-only, which this
// project's classic TS module resolution can't follow, so require it (resolved correctly at
// runtime by Node/webpack). Its `tags` types are declared in cypress/globals.d.ts.
const { register: registerCypressGrep } = require('@cypress/grep');

registerCypressGrep();
addCustomCommand();

/**
 * A lazily loaded route chunk that fails to fetch leaves the app unmounted - vue-router aborts the
 * navigation and nothing re-renders - and the app never recovers on its own. Specs that run with
 * `testIsolation: false` get no fresh page between tests or between retry attempts, so that one
 * failure then fails every remaining test in the file (a single `Loading chunk 2172 failed` in
 * global-settings/settings.spec.ts produced 47 downstream `[data-testid="side-menu"]` failures).
 * Set when a chunk of ours fails so the next test starts from a freshly loaded app.
 */
let reloadAppBeforeNextTest = false;

// TODO handle redirection errors better?
// we see a lot of 'error navigation cancelled' uncaught exceptions that don't actually break anything; ignore them here
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('navigation guard')) {
    return false;
  }

  // Deliberately not returning false, so this attempt still fails and is still reported. With
  // `retries.runMode: 2` a recovered retry will usually pass and the job go green, but the failed
  // attempt is printed by the retry logger below, so an unexplained ChunkLoadError stays visible in
  // the CI output instead of being erased.
  //
  // webpack puts the failing URL in the message ("Loading chunk 2172 failed.\n(error:
  // https://.../dashboard/js/2172.b25e9f35.js)"), and Cypress keeps the original text when it wraps
  // it. Require `/dashboard/js/` so this only ever reacts to our own lazy chunks and never to an
  // identically worded error from a third party bundle - the suse.com pages this suite visits serve
  // their own webpack `.chunk.js` files. That path is Rancher's publicPath and covers every chunk
  // error observed in CI; a consumer serving the bundle from elsewhere gets no recovery rather than
  // a wrong one.
  if (err.message.includes('/dashboard/js/') && (err.name === 'ChunkLoadError' || err.message.includes('Loading chunk'))) {
    reloadAppBeforeNextTest = true;
  }
});

beforeEach(() => {
  // Only specs that opt out of test isolation need this. With `testIsolation: true` Cypress resets
  // the page itself and the retry recovers unaided (proved by the two about.spec.ts chunk jobs),
  // so gating here keeps the visit out of every other spec - including the `setup` specs and the
  // downstream suites that consume this file through the published @rancher/cypress package.
  if (reloadAppBeforeNextTest && Cypress.config('testIsolation') === false) {
    // Reload the app rather than retry the failed request, so the next test is not run against the
    // dead page the chunk failure left behind. See `reloadAppBeforeNextTest` above.
    cy.visit('/');
  }

  reloadAppBeforeNextTest = false;
});

require('cypress-terminal-report/src/installLogsCollector')({
  collectTypes:            ['cons:log', 'cons:info', 'cons:warn', 'cons:error', 'cy:log', 'cy:request', 'cy:xhr'],
  // Enable logging of before and after all
  enableExtendedCollector: true
});

/**
 * if the test failed, print host cpu and memory to cy.log
 */
afterEach(function() {
  // We use a regular function to have access to `this.currentTest`.
  if (this.currentTest?.state === 'failed' && Cypress.env('hasHostStats')) {
    cy.task<{ processCpu: string; memory: string }>('getHostStats').then((stats) => {
      cy.log('**Host Stats on Failure**');
      cy.log(`Process CPU: ${ stats.processCpu }`);
      cy.log(`Memory Usage: ${ stats.memory }`);
      // Pause so the video has time to catch up and show this...
      cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
    });
  }
});

/**
 * The parts of the running mocha test that we need. `currentRetry` and `retries` are typed as
 * protected on mocha's `Runnable`, so they aren't reachable via `this.currentTest`
 */
interface RetryableTest {
  titlePath(): string[];
  currentRetry(): number;
  retries(): number;
  err?: Error;
}

/**
 * Cypress retries failed tests, but the terminal reporter only shows the error from the last
 * attempt. Send every failed attempt to the node process so they all appear in the terminal.
 *
 * See `support/utils/retry-logging.ts`
 */
afterEach(function() {
  // We use a regular function to have access to `this.currentTest`.
  if (this.currentTest?.state !== 'failed' || !Cypress.env('hasRetryLogging')) {
    return;
  }

  let failure: CypressFailedAttempt;

  try {
    const test = this.currentTest as unknown as RetryableTest;
    const totalAttempts = test.retries() + 1;

    if (totalAttempts <= 1) {
      // Retries are disabled, so the reporter's output is already complete
      return;
    }

    failure = {
      spec:    Cypress.spec.relative,
      title:   test.titlePath().join(' > '),
      attempt: test.currentRetry() + 1,
      totalAttempts,
      name:    test.err?.name,
      message: test.err?.message,
      stack:   test.err?.stack,
    };
  } catch (e) {
    // Never fail this hook, doing so would skip all remaining tests in the spec
    return;
  }

  cy.task('logFailedAttempt', failure, { log: false });
});
