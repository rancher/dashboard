import { LoginPagePo } from '@/cypress/integration/po/pages/login-page.po';

describe('Local authentication', () => {
  it('Log in with valid credentials', () => {
    LoginPagePo.goTo();
    cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

    cy.login(Cypress.env('username'), Cypress.env('password'), false);

    cy.wait('@loginReq').then((login) => {
      expect(login.response?.statusCode).to.equal(200);
      cy.url().should('not.equal', `${ Cypress.config().baseUrl }/auth/login`);
    });
  });

  it('Cannot login with invalid credentials', () => {
    LoginPagePo.goTo();

    cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

    cy.login(Cypress.env('username'), `${ Cypress.env('password') }abc`, false);

    cy.wait('@loginReq').then((login) => {
      expect(login.response?.statusCode).to.not.equal(200);
      cy.url().should('equal', `${ Cypress.config().baseUrl }/auth/login`);
    });
  });
});
