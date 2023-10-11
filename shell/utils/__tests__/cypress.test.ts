import { getSpecPattern } from '@shell/utils/cypress';

describe('fx: getSpecPattern', () => {
  it.each([
    [
      ['setup'],
      { TEST_SKIP_SETUP: 'true' },
    ],
    [
      ['global-ui'],
      { TEST_SKIP_GLOBAL_UI: 'true' },
    ],
  ])('should filter paths %p if provided env vars %p', (dirs, envs) => {
    const paths = getSpecPattern(dirs, envs);

    expect(paths).toStrictEqual([]);
  });

  it.each([
    [
      ['setup'],
      ['cypress/e2e/tests/setup/**/*.spec.ts']
    ],
    [
      ['global-ui'],
      ['cypress/e2e/tests/global-ui/**/*.spec.ts']
    ],
  ])('given %p should return path %p if not skipped', (dirs, patterns) => {
    const paths = getSpecPattern(dirs, {});

    expect(paths).toStrictEqual(patterns);
  });
});
