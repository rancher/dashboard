import '@cypress/code-coverage/support';
import './commands';
import registerCypressGrep from '@cypress/grep/src/support';

registerCypressGrep();

before(() => {
  /**
   * Create standard user
   */
  cy.login();
  cy.createUser('user');
});

// TODO handle redirection errors better?
// we see a lot of 'error navigation cancelled' uncaught exceptions that don't actually break anything; ignore them here
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('navigation guard')) {
    return false;
  }
});
