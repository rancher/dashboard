/**
 * How the e2e tests reach a backend. Set with the `TEST_MODE` env var.
 *
 * - `full`        - the tests run against a real Rancher (the default)
 * - `generate`    - as `full`, but every request and response of a passing test is recorded to HAR files
 * - `integration` - no Rancher runs at all, every request is answered from the recorded HAR files
 */
export type E2EMode = 'full' | 'generate' | 'integration';

export const E2E_MODES: E2EMode[] = ['full', 'generate', 'integration'];

/**
 * The name of the scope requests made by a spec's root `before` hooks are recorded in
 */
export const BEFORE_ALL_SCOPE = 'before all';

/**
 * Cypress tasks the browser side uses to tell the record/replay server which test is running
 */
export const E2E_MODE_TASKS = {
  specStart: 'e2eModeSpecStart',
  testStart: 'e2eModeTestStart',
  testEnd:   'e2eModeTestEnd',
  specEnd:   'e2eModeSpecEnd',
};

export interface E2EModeTestStart {
  spec: string;
  title: string;
}

export interface E2EModeTestEnd {
  spec: string;
  title: string;
  passed: boolean;
}

export interface E2EModeTestEndResult {
  /**
   * Requests that had no recording to replay (integration mode only)
   */
  misses: string[];
}
