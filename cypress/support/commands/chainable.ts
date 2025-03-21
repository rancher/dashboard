
/**
 * Check if an element is visible to the user on the screen.
 */
Cypress.Commands.add('isVisible', { prevSubject: true }, (subject) => {
  const bottom = Cypress.$(cy.state('window')).height();
  const rect = subject[0].getBoundingClientRect();

  expect(rect.top).not.to.be.greaterThan(bottom);
  expect(rect.bottom).not.to.be.greaterThan(bottom);
});

/**
 * Check if an element is disabled
 */
Cypress.Commands.add('isDisabled', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.disabled');
});

/**
 * Check if an element is enabled
 */
Cypress.Commands.add('isEnabled', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.enabled');
});

function setupWebSocket(CATTLE_TEST_URL: string, NAMESPACE: string, POD_NAME: string, CONTAINER_NAME: string, commandSend: string, BEARER_TOKEN: string, folderName: string) {
  return cy.task('setupWebSocket', {
    CATTLE_TEST_URL,
    NAMESPACE,
    POD_NAME,
    CONTAINER_NAME,
    commandSend,
    BEARER_TOKEN,
  });
}

Cypress.Commands.add('setupWebSocket', setupWebSocket);
