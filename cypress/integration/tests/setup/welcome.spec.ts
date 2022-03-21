import { WelcomePagePo } from '@/cypress/integration/po/pages/welcome.po';

describe('Welcome', () => {
  it('Requires initial setup', () => {
    cy.visit('');

    cy.url().should('equal', `${ Cypress.config().baseUrl }/auth/login`);
  });

  it('Set initial Docker bootstrap password', () => {
    WelcomePagePo.goTo(); // Needs to happen before the page element is created/located
    cy.intercept('POST', '/v3-public/localProviders/local?action=login').as('bootstrapReq');
    const page = new WelcomePagePo();

    page.canSubmit()
      .should('eq', true);
    page.password().set(Cypress.env('bootstrapPassword'));
    page.canSubmit()
      .should('eq', true);
    page.submit();

    cy.wait('@bootstrapReq').then((login) => {
      expect(login.response?.statusCode).to.equal(200);
      cy.url().should('equal', `${ Cypress.config().baseUrl }/auth/setup`);
    });
  });
});
