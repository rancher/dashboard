import '@cypress/code-coverage/support';
import './commands/commands';
import './commands/rancher-api-commands.ts';
import registerCypressGrep from '@cypress/grep/src/support';
import { addCustomCommand } from 'cypress-delete-downloads-folder';

registerCypressGrep();
addCustomCommand();

// TODO handle redirection errors better?
// we see a lot of 'error navigation cancelled' uncaught exceptions that don't actually break anything; ignore them here
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('navigation guard')) {
    return false;
  }
});
