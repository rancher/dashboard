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

// TODO handle redirection errors better?
// we see a lot of 'error navigation cancelled' uncaught exceptions that don't actually break anything; ignore them here
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('navigation guard')) {
    return false;
  }
  // Lazy-loaded webpack chunks intermittently fail to fetch while the app is starting up
  // (ChunkLoadError). It is a transient FRONTEND fetch failure - the chunk loads on the next
  // attempt - that the backend readiness probe in e2e-k3s-start.sh cannot prevent. Left
  // unhandled it aborts the first-login setup mid-flow, after the bootstrap login has already
  // changed the admin password, so every retry then 401s on the bootstrap login. Ignore it.
  if (err.message.includes('ChunkLoadError') || err.message.includes('Loading chunk')) {
    return false;
  }
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
