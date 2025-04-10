import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { PARTIAL_SETTING_THRESHOLD } from '@/cypress/support/utils/settings-utils';

const successStatusCode = 200;

describe('Local authentication', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  it('Confirm correct number of settings requests made', () => {
    cy.intercept(
      'GET',
      '/v1/management.cattle.io.settings?exclude=metadata.managedFields'
    ).as('settingsReq');
    const loginPage = new LoginPagePo();

    loginPage.goTo();

    // First request will fetch a partial list of settings
    cy.wait('@settingsReq').then((interception) => {
      expect(interception.response.body.count).lessThan(
        PARTIAL_SETTING_THRESHOLD
      );
    });
    cy.get('@settingsReq.all').should('have.length', 1);

    loginPage.waitForPage();
    loginPage.switchToLocal();
    loginPage.username().set(Cypress.env('username'));
    loginPage.password().set(Cypress.env('password'));
    loginPage.submit();

    new HomePagePo().waitForPage();

    // Second request (after user is logged in) will return the full list
    cy.wait('@settingsReq').then((interception) => {
      expect(interception.response.body.count).greaterThan(
        PARTIAL_SETTING_THRESHOLD
      );
    });
    // Yes this is bad, but want to ensure no other settings requests are made.
    cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
    cy.get('@settingsReq.all').should('have.length', 2);
  });

  it('Log in with valid credentials', () => {
    LoginPagePo.goTo();

    cy.intercept('POST', '/v3-public/localProviders/local*').as('loginReq');

    const loginPage = new LoginPagePo();

    // take screenshot if locator is visible.
    loginPage.canSubmit().then((canSubmit) => {
      if (canSubmit) {
        // Take a snapshot for visual difference
        cy.percySnapshot('Login test');
      }
    });

    cy.login(Cypress.env('username'), Cypress.env('password'), false);

    cy.wait('@loginReq').then((login) => {
      if (login.response?.statusCode !== successStatusCode) {
        cy.log(
          'Login incorrectly failed',
          login.response?.statusCode,
          login.response?.statusMessage,
          JSON.stringify(login.response?.body || {})
        );
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
        cy.log(
          'Login incorrectly succeeded',
          login.response?.statusCode,
          login.response?.statusMessage,
          JSON.stringify(login.response?.body || {})
        );
      }
      expect(login.response?.statusCode).to.not.equal(successStatusCode);

      // URL is partial as it may change based on the authentication configuration present
      cy.url().should('include', `${ Cypress.config().baseUrl }/auth/login`);
    });
  });
}
);
