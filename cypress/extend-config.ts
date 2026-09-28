import { defineConfig } from 'cypress';
import baseConfig from './base-config';

/**
 * Helper function to extend the base config with custom settings
 * @param customConfig Custom configuration to merge with base config
 * @returns Extended Cypress configuration
 */
export const extendConfig = (customConfig: Partial<Cypress.ConfigOptions>) => {
  return defineConfig({
    ...baseConfig,
    ...customConfig,
    env: {
      ...baseConfig.env,
      ...customConfig.env
    },
    e2e: {
      ...baseConfig.e2e,
      ...customConfig.e2e
    }
  });
};

export default extendConfig;
