import { FirstLoginPagePo } from '@/cypress/integration/po/pages/first-login.po';

describe('First Login', () => {
  it('Requires to set admin password', () => {
    FirstLoginPagePo.goTo();

    cy.url().should('equal', `${ Cypress.config().baseUrl }/auth/setup`);
  });

  it('Set initial admin password for the user', () => {
    FirstLoginPagePo.goTo(); // Needs to happen before the page element is created/located
    cy.intercept('POST', '/v3-public/localProviders/local?action=login').as('firstLoginReq');
    const page = new FirstLoginPagePo();

    page.canSubmit()
      .should('eq', true);
    page.choosePassword().set(1);
    page.password().set(Cypress.env('password'));
    page.confirmPassword().set(Cypress.env('password'));
    page.termsAgreement().set();
    page.canSubmit()
      .should('eq', true);
    page.submit();

    cy.wait('@firstLoginReq').then((login) => {
      expect(login.response?.statusCode).to.equal(200);
      cy.url().should('equal', `${ Cypress.config().baseUrl }/auth/setup`);
    });
  });
});
