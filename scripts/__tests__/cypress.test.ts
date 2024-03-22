import { getSpecPattern } from '@/scripts/cypress';

describe('fx: getSpecPattern', () => {
  it('should returns everything if no env vars', () => {
    const dirs = ['setup', 'global-ui'];
    const expectation = ['cypress/e2e/tests/setup/**/*.spec.ts', 'cypress/e2e/tests/global-ui/**/*.spec.ts'];
    const paths = getSpecPattern(dirs, {});

    expect(paths).toStrictEqual(expectation);
  });

  it.each([
    [
      ['setup'],
      { TEST_SKIP: 'setup' },
    ],
    [
      ['global-ui', 'setup'],
      { TEST_SKIP: 'global-ui, setup' },
    ],
  ])('should filter paths %p if provided env vars %p', (dirs, envs) => {
    const paths = getSpecPattern(dirs, envs);

    expect(paths).toStrictEqual([]);
  });

  it('should filter similar paths', () => {
    const dirs = ['same', 'same-same'];
    const envs = { TEST_SKIP: 'same' };
    const paths = getSpecPattern(dirs, envs);

    expect(paths).toStrictEqual(['cypress/e2e/tests/same-same/**/*.spec.ts']);
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

  it.each([
    [
      ['setup', 'something-else'],
      { TEST_ONLY: 'setup' },
      ['cypress/e2e/tests/setup/**/*.spec.ts']
    ],
    [
      ['global-ui', 'setup'],
      { TEST_ONLY: 'global-ui, setup' },
      [
        'cypress/e2e/tests/global-ui/**/*.spec.ts',
        'cypress/e2e/tests/setup/**/*.spec.ts'
      ]
    ],
  ])('should consider only paths %p if env vars %p', (dirs, envs, expectation) => {
    const paths = getSpecPattern(dirs, envs);

    expect(paths).toStrictEqual(expectation);
  });

  it('should not skip focused specs', () => {
    const dirs = ['setup', 'something-else'];
    const envs = { TEST_ONLY: 'setup', TEST_SKIP: 'setup' };
    const paths = getSpecPattern(dirs, envs);

    expect(paths).toStrictEqual(['cypress/e2e/tests/setup/**/*.spec.ts']);
  });
});
