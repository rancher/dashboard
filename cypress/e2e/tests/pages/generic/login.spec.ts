import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { PARTIAL_SETTING_THRESHOLD } from '@/cypress/support/utils/settings-utils';
import { PAGINATION_UTILS } from '@/cypress/support/utils/shell';

const successStatusCode = 200;

describe('Local authentication', { tags: ['@generic', '@adminUser', '@standardUser'] }, () => {
  it('Confirm correct number of settings requests made', () => {
    cy.intercept(
      'GET',
      `/v1/management.cattle.io.settings?pagesize=${ PAGINATION_UTILS.defaultPageSize }&exclude=metadata.managedFields`
    ).as('settingsReq');
    cy.intercept('POST', '/v1-public/login').as('bootstrapReq');

    const loginPage = new LoginPagePo();

    loginPage.goTo();

    // First request will fetch a partial list of settings
    cy.wait('@settingsReq').then((interception) => {
      expect(interception.response?.body.count).lessThan(
        PARTIAL_SETTING_THRESHOLD
      );
    });
    cy.get('@settingsReq.all').should('have.length', 1);

    loginPage.waitForPage();
    loginPage.switchToLocal();
    loginPage.username().set(Cypress.env('username'));
    loginPage.password().set(Cypress.env('password'));
    loginPage.submit();

    cy.wait('@bootstrapReq').then((login) => {
      expect(login.response?.statusCode).to.equal(200);
    });

    // Second request (after user is logged in) will return the full list
    cy.wait('@settingsReq').then((interception) => {
      expect(interception.response?.body.count).greaterThan(
        PARTIAL_SETTING_THRESHOLD
      );
    });

    new HomePagePo().waitForPage();

    // Yes this is bad, but want to ensure no other settings requests are made.
    cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
    cy.get('@settingsReq.all').should('have.length', 2);
  });

  it('Log in with valid credentials', () => {
    LoginPagePo.goTo();

    cy.intercept('POST', '/v1-public/login*').as('loginReq');

    const loginPage = new LoginPagePo();

    // take screenshot if locator is visible.
    loginPage.canSubmit().then((canSubmit) => {
      if (canSubmit) {
        // Take a snapshot for visual difference
        cy.percySnapshot('Login test');
      }
    });

    cy.login(Cypress.env('username'), Cypress.env('password'), false);

    // using @loginReq outside of where it's defined is brittle....
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

  it('Shows the local login form without a provider list when local is the only provider', () => {
    LoginPagePo.goTo();

    const loginPage = new LoginPagePo();

    loginPage.waitForPage();
    loginPage.providerList().checkNotExists();
  });

  describe('Multiple authentication providers', () => {
    // Several IDPs can't be configured from a test, so the public provider list
    // is stubbed. Everything under test here is client side.
    const stubProviders = () => {
      cy.intercept('GET', '/v1-public/authproviders*', {
        statusCode: 200,
        body:       {
          type: 'collection',
          data: [
            {
              id: 'local', type: 'localProvider', _type: 'localProvider'
            },
            {
              id: 'okta-corp', type: 'oktaProvider', _type: 'oktaProvider'
            },
            {
              id:          'okta-partner',
              type:        'oktaProvider',
              _type:       'oktaProvider',
              description: 'Partners and contractors.',
            },
            {
              id: 'gh-community', type: 'githubProvider', _type: 'githubProvider'
            },
          ],
        },
      }).as('authProviders');
    };

    beforeEach(() => {
      stubProviders();
      LoginPagePo.goTo();
      cy.wait('@authProviders');
    });

    it('Offers a provider list instead of one button per provider', () => {
      const loginPage = new LoginPagePo();

      loginPage.waitForPage();
      loginPage.providerSubmitButton().checkVisible();
      loginPage.providerList().checkVisible();

      // The old per-provider button stack is gone.
      cy.get('[data-testid="login-provider-submit"]').should('have.length', 1);
    });

    it('Lists the remaining providers, plus local, on the page', () => {
      const loginPage = new LoginPagePo();

      loginPage.waitForPage();

      loginPage.providerOption('okta-corp').checkVisible();
      loginPage.providerOption('okta-partner').checkVisible();
      loginPage.providerOption('local').checkVisible();
      // The provider on the primary button is not offered twice.
      loginPage.providerOption('gh-community').checkNotExists();
    });

    it('Describes a provider with the words the admin gave it', () => {
      const loginPage = new LoginPagePo();

      loginPage.waitForPage();

      loginPage.providerOption('okta-partner').shouldContainText('Partners and contractors.');
    });

    // However many providers are configured, local must not scroll out of reach.
    it('Keeps local out of the scrolling part of the list', () => {
      const loginPage = new LoginPagePo();

      loginPage.waitForPage();

      loginPage.providerScrollList().checkVisible();
      loginPage.providerScrollList().self().find('[data-testid="login-provider-option-okta-corp"]').should('exist');
      loginPage.providerScrollList().self().find('[data-testid="login-provider-option-local"]').should('not.exist');
      loginPage.providerOption('local').checkVisible();
    });

    // Every option has to be reachable by keyboard. Asserted structurally rather
    // than by driving the tab key: the options are natively focusable buttons in
    // the order they are read out, so tab order follows from the DOM.
    it('Puts every provider in the list in the keyboard tab order', () => {
      const loginPage = new LoginPagePo();

      loginPage.waitForPage();

      loginPage.providerList().self().find('[data-testid^="login-provider-option-"]').should(($options) => {
        expect($options.toArray().map((el) => el.getAttribute('data-testid'))).to.deep.equal([
          'login-provider-option-okta-corp',
          'login-provider-option-okta-partner',
          'login-provider-option-local',
        ]);

        $options.toArray().forEach((el) => {
          expect(el.tagName, 'options are buttons').to.equal('BUTTON');
          expect(el.getAttribute('tabindex'), 'options are not taken out of the tab order').not.to.equal('-1');
          expect(el.hasAttribute('disabled'), 'options are not disabled').to.equal(false);
        });
      });

      // Focus still lands where it is put, which is what the list's own focus()
      // relies on when the page reveals it.
      loginPage.providerOption('okta-corp').self().focus();
      cy.focused().should('have.attr', 'data-testid', 'login-provider-option-okta-corp');
    });

    it('Changes the primary button when another provider is chosen', () => {
      const loginPage = new LoginPagePo();

      loginPage.selectProvider('okta-partner');

      loginPage.providerSubmitButton().shouldContainText('okta-partner');
      // Choosing a provider must not log the user in on its own.
      cy.url().should('include', '/auth/login');
    });

    it('Reveals the local form when local is chosen', () => {
      const loginPage = new LoginPagePo();

      loginPage.selectProvider('local');

      loginPage.username().checkVisible();
      loginPage.password().checkVisible();
      // The form owns the panel, so the list collapses to a link.
      loginPage.providerList().checkNotExists();
      loginPage.chooseDifferentProvider().checkVisible();
    });

    it('Brings the list back from the local form', () => {
      const loginPage = new LoginPagePo();

      loginPage.selectProvider('local');
      loginPage.chooseDifferentProvider().self().click();

      loginPage.providerList().checkVisible();
      // The form gives way to the provider the page opened on, and local goes
      // back to being one of the options.
      loginPage.providerSubmitButton().shouldContainText('gh-community');
      loginPage.providerOption('local').checkVisible();

      loginPage.selectProvider('okta-partner');
      loginPage.providerSubmitButton().shouldContainText('okta-partner');
    });

    it('Reopens on the remembered provider', () => {
      const loginPage = new LoginPagePo();

      loginPage.selectProvider('okta-partner');
      loginPage.rememberProviderCheckbox().set();

      stubProviders();
      LoginPagePo.goTo();
      cy.wait('@authProviders');

      loginPage.providerSubmitButton().shouldContainText('okta-partner');
    });

    it('Falls back to the first provider once the choice is forgotten', () => {
      const loginPage = new LoginPagePo();

      loginPage.selectProvider('okta-partner');
      loginPage.rememberProviderCheckbox().set();
      loginPage.rememberProviderCheckbox().set();

      stubProviders();
      LoginPagePo.goTo();
      cy.wait('@authProviders');

      loginPage.providerSubmitButton().shouldContainText('gh-community');
    });
  });

  // Local is one of the ways in, so one external provider alongside it is still
  // a choice, and it is made from the same list as any other.
  describe('A single external authentication provider', () => {
    beforeEach(() => {
      cy.intercept('GET', '/v1-public/authproviders*', {
        statusCode: 200,
        body:       {
          type: 'collection',
          data: [
            {
              id: 'local', type: 'localProvider', _type: 'localProvider'
            },
            {
              id: 'okta-corp', type: 'oktaProvider', _type: 'oktaProvider'
            },
          ],
        },
      }).as('authProviders');

      LoginPagePo.goTo();
      cy.wait('@authProviders');
    });

    it('Offers local from the list rather than from a link', () => {
      const loginPage = new LoginPagePo();

      loginPage.waitForPage();

      loginPage.providerSubmitButton().shouldContainText('okta-corp');
      loginPage.providerList().checkVisible();
      loginPage.providerOption('local').checkVisible();
      cy.get('[data-testid="login-useLocal"]').should('not.exist');
    });

    it('Reveals the local form when local is chosen', () => {
      const loginPage = new LoginPagePo();

      loginPage.selectProvider('local');

      loginPage.username().checkVisible();
      loginPage.password().checkVisible();
      loginPage.chooseDifferentProvider().checkVisible();
    });
  });

  it('Cannot login with invalid credentials', () => {
    LoginPagePo.goTo();

    cy.intercept('POST', '/v1-public/login*').as('loginReq');

    cy.login(Cypress.env('username'), `${ Cypress.env('password') }abc`, false);

    // using @loginReq outside of where it's defined is brittle....
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
