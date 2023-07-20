import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

const successStatusCode = 200;

describe('Local authentication', { tags: ['@adminUser', '@standardUser'] }, () => {
  it('Log in with valid credentials', () => {
    LoginPagePo.goTo();
    cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

    cy.login(Cypress.env('username'), Cypress.env('password'), false);

    cy.wait('@loginReq').then((login) => {
      if (login.response?.statusCode !== successStatusCode) {
        cy.log('Login incorrectly failed', login.response?.statusCode, login.response?.statusMessage, JSON.stringify(login.response?.body || {}));
      }
      expect(login.response?.statusCode).to.equal(successStatusCode);

      cy.url().should('not.equal', `${ Cypress.config().baseUrl }/auth/login`);
    });
  });

  it('Cannot login with invalid credentials', () => {
    LoginPagePo.goTo();

    cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

    cy.login(Cypress.env('username'), `${ Cypress.env('password') }abc`, false);

    cy.wait('@loginReq').then((login) => {
      if (login.response?.statusCode === successStatusCode) {
        cy.log('Login incorrectly succeeded', login.response?.statusCode, login.response?.statusMessage, JSON.stringify(login.response?.body || {}));
      }
      expect(login.response?.statusCode).to.not.equal(successStatusCode);

      // URL is partial as it may change based on the authentication configuration present
      cy.url().should('include', `${ Cypress.config().baseUrl }/auth/login`);
    });
  });
});
