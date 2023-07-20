describe('Login page a11y testing', { tags: ['@adminUser', '@standardUser'] }, () => {
  it('wcag21aa test', () => {
    cy.visit(`${ Cypress.config().baseUrl }`);
    cy.injectAxe();
    cy.wait(600); 

    cy.checkPageAccessibility();
  });
});
  