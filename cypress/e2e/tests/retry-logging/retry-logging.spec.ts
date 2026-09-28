/**
 * THIS SPEC IS EXPECTED TO FAIL.
 *
 * It exists to verify that every Cypress retry attempt is printed to the terminal, and not just
 * the last one (see the `logFailedAttempt` task in `cypress/base-config.ts` and the `afterEach`
 * in `cypress/support/e2e.ts`). Each attempt fails with a different message, so a successful
 * run shows `retry-marker-1`, `retry-marker-2` and `retry-marker-3` in the terminal output.
 *
 * It is never run by CI. `retry-logging` isn't one of the `testDirs` in `cypress/base-config.ts`,
 * so the default `specPattern` cannot match it, and the `@retryLogging` tag matches none of the
 * `GREP_TAGS` expressions in `.github/workflows/test.yaml`. Run it on demand with
 *
 *   yarn cy:run --config specPattern=cypress/e2e/tests/retry-logging/**\/*.spec.ts
 *
 * `--spec` on its own is not enough - Cypress filters it against `specPattern`, which never
 * matches this directory, so `specPattern` has to be overridden instead. `baseUrl` still has to
 * point at a reachable server (Cypress verifies it before every run) even though this spec never
 * visits it, so add `,baseUrl=<url>` if nothing is serving the default.
 *
 * The spec module is only evaluated once, so the counter below increments on each retry of the
 * test body.
 */
let attempt = 0;

describe('Retry attempt logging', { tags: ['@retryLogging'] }, () => {
  it('should fail with a unique message on every attempt', { tags: ['@retryLogging'] }, () => {
    attempt++;

    expect(`retry-marker-${ attempt }`).to.equal('retry-marker-never');
  });
});
