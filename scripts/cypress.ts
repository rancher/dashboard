/**
 * These utils are aimed to be used and tested for the Cypress configuration
 */

/**
 * Filter test spec paths based on env var configuration
 * @returns
 */
export const getSpecPattern = (dirs: string[], envs: NodeJS.ProcessEnv): string[] => {
  // Gets paths with only
  const onlyDirs = dirs.filter((dir) => (envs.TEST_ONLY?.split(',').map((env) => env.trim()).includes(dir)));

  // List the test directories to be included
  const activeDirs = dirs.filter((dir) => !(envs.TEST_SKIP?.split(',').map((env) => env.trim()).includes(dir)));

  const finalDirs = onlyDirs.length ? onlyDirs : activeDirs;
  const paths = finalDirs.map((dir) => `cypress/e2e/tests/${ dir }/**/*.spec.ts`);

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log(`Running tests for paths: ${ paths.join(', ') }`);
  }

  return paths;
};
