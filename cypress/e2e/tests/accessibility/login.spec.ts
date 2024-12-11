// const WAIT = 600;

describe('Login page a11y testing', { tags: ['@adminUser', '@standardUser'] }, () => {
  it('wcag21aa test', () => {
    cy.visit(`${ Cypress.config().baseUrl }/auth/login?local`);
    cy.injectAxe();
    // cy.wait(WAIT);
    cy.checkAccessibility();
  });

  it('username fieldt', () => {
    cy.visit(`${ Cypress.config().baseUrl }/auth/login?local`);
    cy.injectAxe();
    // cy.wait(WAIT);
    // cy.checkPageAccessibility();

    cy.checkAccessibility('#username');
  });
});
