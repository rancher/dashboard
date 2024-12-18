import '@cypress/code-coverage/support';
import './commands/commands';
import './commands/chainable';
import './commands/rancher-api-commands';
import registerCypressGrep from '@cypress/grep/src/support';
import { addCustomCommand } from 'cypress-delete-downloads-folder';
import 'cypress-mochawesome-reporter/register';
import { addMatchImageSnapshotCommand } from '@emerson-eps/cypress-image-snapshot/command'

registerCypressGrep();
addCustomCommand();

// can also add any default options to be used
// by all instances of `matchImageSnapshot`
addMatchImageSnapshotCommand({
  failureThreshold: 0,
  padding: 10,
})


// TODO handle redirection errors better?
// we see a lot of 'error navigation cancelled' uncaught exceptions that don't actually break anything; ignore them here
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('navigation guard')) {
    return false;
  }
});
