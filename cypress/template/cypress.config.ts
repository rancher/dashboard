// Extend the base Cypress configuration
import { extendConfig } from '@rancher/cypress/extend-config';

export default extendConfig({
  // Custom configuration options can be added here
  env: {
    // Custom environment variables can be added here
  },
  e2e: {
    supportFile: './cypress/support/e2e.ts',
    // Custom e2e configuration can be added here
  }
});
