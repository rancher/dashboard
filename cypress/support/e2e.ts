import '@cypress/code-coverage/support';
import './commands/commands';
import './commands/chainable';
import './commands/rancher-api-commands';
import './commands/accessiblity';

import registerCypressGrep from '@cypress/grep/src/support';
import { addCustomCommand } from 'cypress-delete-downloads-folder';
import 'cypress-mochawesome-reporter/register';
import '@percy/cypress';
import 'cypress-axe';

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
