// Example of custom command
Cypress.Commands.add('customCommand', () => {
  cy.visit('/');
});