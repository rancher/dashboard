/**
 * Cypress retries failed tests (see `retries.runMode` in `cypress/base-config.ts`), but the
 * terminal reporter only ever shows the error from the *final* attempt. Mocha's spec reporter
 * (used for console output by `cypress-mochawesome-reporter`) handles the `fail` event and
 * ignores `retry`, so a flaky test that fails differently on each attempt loses everything
 * except the last failure - which is usually the information needed to diagnose the flake.
 *
 * The `afterEach` in `cypress/support/e2e.ts` collects each failed attempt and hands it to the
 * `logFailedAttempt` task registered in `cypress/base-config.ts`, which prints it with the
 * formatter below.
 */
export interface CypressFailedAttempt {
  /** Spec file the test belongs to, relative to the project root */
  spec: string;
  /** Full title of the test, including the enclosing describe blocks */
  title: string;
  /** 1 based attempt number */
  attempt: number;
  /** Total number of attempts the test is allowed */
  totalAttempts: number;
  name?: string;
  message?: string;
  stack?: string;
}

const HEADER_INDENT = '  ';
const BODY_INDENT = '      ';

/** Number of stack frames to show. Enough to locate the failure without burying the message */
const STACK_FRAMES = 5;

const indent = (text: string, prefix: string): string => text
  .split('\n')
  .map((line) => `${ prefix }${ line.trim() }`)
  .join('\n');

/**
 * Format a single failed attempt as a block of terminal output
 */
export const formatFailedCypressAttempt = (failure: CypressFailedAttempt): string => {
  const {
    spec, title, attempt, totalAttempts, name, message, stack
  } = failure;

  const lines = [
    '',
    `${ HEADER_INDENT }(Attempt ${ attempt } of ${ totalAttempts }) ${ title }`,
    `${ HEADER_INDENT }${ spec }`
  ];

  const error = [name, message].filter((part) => !!part).join(': ');

  if (error) {
    lines.push(indent(error, BODY_INDENT));
  }

  // Cypress error stacks repeat the message in their leading lines, so only keep the frames
  const frames = (stack || '')
    .split('\n')
    .filter((line) => line.trim().startsWith('at '))
    .slice(0, STACK_FRAMES);

  frames.forEach((frame) => lines.push(indent(frame, BODY_INDENT)));

  lines.push('');

  return lines.join('\n');
};
