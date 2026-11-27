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
 * The record/replay server's control requests, `POST <origin>/<path>/<action>`, which tell it which spec and test is
 * running. They are not recorded
 */
export const E2E_MODE_CONTROL_PATH = '__e2e-mode';

export type E2EModeControlAction = 'spec-start' | 'test-start' | 'test-end' | 'spec-end';

export interface E2EModeControl {
  spec: string;
  /** The test's titles, outermost first, joined with ' > ' (test-start and test-end) */
  title?: string;
  /** Whether the test passed (test-end) */
  passed?: boolean;
}

export interface E2EModeTestEndResult {
  /**
   * Requests that had no recording to replay (integration mode only)
   */
  misses: string[];
}
