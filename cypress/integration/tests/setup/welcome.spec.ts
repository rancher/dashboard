import { WelcomePagePo } from '@/cypress/integration/po/pages/welcome.po';
import { FirstLoginPagePo } from '@/cypress/integration/po/pages/first-login.po';

describe('Welcome', () => {
  it('Requires initial setup', () => {
    cy.visit('');

    new WelcomePagePo().hasInfoMessage();
    cy.url().should('equal', `${ Cypress.config().baseUrl }/auth/login`);
  });

  it('Set initial Docker bootstrap password and admin password as single session', () => {
    WelcomePagePo.goTo(); // Needs to happen before the page element is created/located
    cy.intercept('POST', '/v3-public/localProviders/local?action=login').as('bootstrapReq');
    const welcome = new WelcomePagePo();

    welcome.canSubmit()
      .should('eq', true);
    welcome.password().set(Cypress.env('bootstrapPassword'));
    welcome.canSubmit()
      .should('eq', true);
    welcome.submit();

    cy.wait('@bootstrapReq').then((login) => {
      expect(login.response?.statusCode).to.equal(200);
      cy.url().should('equal', `${ Cypress.config().baseUrl }/auth/setup`);
    });

    cy.intercept('PUT', '/v1/userpreferences/*').as('firstLoginReq');

    const firstLogin = new FirstLoginPagePo();

    firstLogin.canSubmit()
      .should('eq', true);
    firstLogin.choosePassword().set(1);
    firstLogin.password().set(Cypress.env('password'));
    firstLogin.confirmPassword().set(Cypress.env('password'));
    firstLogin.termsAgreement().set();
    firstLogin.canSubmit()
      .should('eq', true);
    firstLogin.submit();

    cy.wait('@firstLoginReq').then((login) => {
      expect(login.response?.statusCode).to.equal(200);
      cy.url().should('equal', `${ Cypress.config().baseUrl }/home`);
    });
  });
});
