/**
 * These utils are aimed to be used and tested for the Cypress configuration
 */

import { snakeCase } from 'lodash';

/**
 * Filter test spec paths based on env var configuration
 * @returns
 */
export const getSpecPattern = (dirs: string[], envs: NodeJS.ProcessEnv): string[] => {
  // List the test directories to be included
  const activePaths = dirs
    .map((dir) => ({
      path:   `cypress/e2e/tests/${ dir }/**/*.spec.ts`,
      active: !(envs[`TEST_SKIP_${ snakeCase(dir).toUpperCase() }`] === 'true')
    }))
    .filter(({ active }) => Boolean(active)).map(({ path }) => path);

  return [
    ...activePaths,
  ];
};
