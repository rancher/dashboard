import '@cypress/code-coverage/support';
import './commands/commands';
import './commands/rancher-api-commands.ts';
import registerCypressGrep from '@cypress/grep/src/support';

registerCypressGrep();

// TODO handle redirection errors better?
// we see a lot of 'error navigation cancelled' uncaught exceptions that don't actually break anything; ignore them here
Cypress.on('uncaught:exception', (e, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});
