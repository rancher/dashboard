import { RancherSetupLoginPagePo } from '@/cypress/e2e/po/pages/rancher-setup-login.po';
import { RancherSetupConfigurePage } from '@/cypress/e2e/po/pages/rancher-setup-configure.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { PARTIAL_SETTING_THRESHOLD } from '@/cypress/support/utils/settings-utils';
import { serverUrlLocalhostCases, urlWithTrailingForwardSlash, httpUrl, nonUrlCases } from '@/cypress/e2e/blueprints/global_settings/settings-data';
import { HELM_STARTUP_DELAY_OPT } from '@/cypress/support/utils/timeouts';
import { PAGINATION_UTILS } from '@/cypress/support/utils/shell';

// Cypress or the GrepTags avoid to run multiples times the same test for each tag used.
// This is a temporary solution till initialization is not handled as a test
describe('Rancher setup', { tags: ['@adminUserSetup', '@standardUserSetup', '@setup', '@components', '@navigation', '@charts', '@explorer', '@explorer2', '@extensions', '@fleet', '@generic', '@globalSettings', '@manager', '@userMenu', '@usersAndAuths', '@elemental', '@virtualizationMgmt', '@accessibility'] }, () => {
  const rancherSetupLoginPage = new RancherSetupLoginPagePo();
  const rancherSetupConfigurePage = new RancherSetupConfigurePage();
  const homePage = new HomePagePo();

  it('Requires initial setup', () => {
    homePage.goTo();

    rancherSetupLoginPage.goTo();
    rancherSetupLoginPage.waitForPage();
    rancherSetupLoginPage.hasInfoMessage();
  });

  it('Confirm correct number of settings requests made', () => {
    cy.intercept('GET', `/v1/management.cattle.io.settings?pagesize=${ PAGINATION_UTILS.defaultPageSize }&exclude=metadata.managedFields`).as('settingsReq');
    cy.intercept('POST', '/v1-public/login').as('bootstrapReq');

    rancherSetupLoginPage.goTo();

    // First request will fetch a partial list of settings
    cy.wait('@settingsReq').then((interception) => {
      expect(interception.response?.body.count).lessThan(PARTIAL_SETTING_THRESHOLD);
    });
    cy.get('@settingsReq.all').should('have.length', 1);

    rancherSetupLoginPage.waitForPage();
    rancherSetupLoginPage.bootstrapLogin();

    // Wait for login to succeed, to get things like CSRF
    cy.wait('@bootstrapReq').then((login) => {
      expect(login.response?.statusCode).to.equal(200);
    });

    // Second request (after user is logged in) will return the full list
    cy.wait('@settingsReq', HELM_STARTUP_DELAY_OPT).then((interception) => {
      expect(interception.response?.body.count).gte(PARTIAL_SETTING_THRESHOLD);
    });

    // Wait for actual page we need
    rancherSetupConfigurePage.waitForPage();

    // Yes this is bad, but want to ensure no other settings requests are made.
    cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
    cy.get('@settingsReq.all').should('have.length', 2);
  });

  it('Login & Configure', () => {
    cy.intercept('POST', '/v1-public/login').as('bootstrapReq');

    rancherSetupLoginPage.goTo();
    rancherSetupLoginPage.waitForPage();
    rancherSetupLoginPage.bootstrapLogin();

    cy.wait('@bootstrapReq').then((login) => {
      if (login.response?.statusCode !== 200) {
        // Retry-safe: a prior (failed) attempt already changed the admin password, so the
        // bootstrap password no longer works (401). First-run config is submitted together
        // with the password change, so a changed password means the instance is already
        // configured - log in with the configured password and verify we land on home,
        // rather than failing every retry on the dead bootstrap login.
        cy.login();
        homePage.goTo();
        homePage.waitForPage();

        return;
      }

      // Fresh instance: bootstrap login succeeded, run the full first-run configuration.
      rancherSetupConfigurePage.waitForPage();

      cy.intercept('PUT', '/v1/userpreferences/*').as('firstLoginReq');

      rancherSetupConfigurePage.canSubmit().should('eq', false);
      // Check server url validation
      rancherSetupConfigurePage.serverUrl().self().should('be.visible');
      rancherSetupConfigurePage.serverUrl().self().invoke('val').then((initialServerUrl) => {
      // Check showing localhost warning banner
        serverUrlLocalhostCases.forEach((url) => {
          rancherSetupConfigurePage.serverUrl().set(url);
          rancherSetupConfigurePage.serverUrlLocalhostWarningBanner().banner().should('exist').and('be.visible');
        });
        // Check showing error banner when the urls has trailing forward slash
        rancherSetupConfigurePage.serverUrl().set(urlWithTrailingForwardSlash);
        rancherSetupConfigurePage.errorBannerContent('Server URL should not have a trailing forward slash.').should('exist').and('be.visible');
        // Check showing error banner when the url is not HTTPS
        rancherSetupConfigurePage.serverUrl().set(httpUrl);
        rancherSetupConfigurePage.errorBannerContent('Server URL must be https.').should('exist').and('be.visible');
        // // Check showing error banner when the input value is not a url
        nonUrlCases.forEach((inputValue) => {
          rancherSetupConfigurePage.serverUrl().set(inputValue);
          rancherSetupConfigurePage.errorBannerContent('Server URL must be an URL.').should('exist').and('be.visible');
          // A non-url is also a non-https
          rancherSetupConfigurePage.errorBannerContent('Server URL must be https.').should('exist').and('be.visible');
        });
        rancherSetupConfigurePage.serverUrl().set(initialServerUrl);
      });

      rancherSetupConfigurePage.termsAgreement().set();
      rancherSetupConfigurePage.canSubmit().should('eq', true);
      rancherSetupConfigurePage.submit();

      cy.location('pathname', { timeout: 15000 }).should('include', '/home');

      cy.wait('@firstLoginReq').then((loginPref) => {
        expect(loginPref.response?.statusCode).to.equal(200);
        homePage.waitForPage();
      });
    });
  });

  it('Create standard user', () => {
    cy.login();

    // Note: the username argument here should match the TEST_USERNAME env var used when running non-admin tests
    cy.createUser({
      username:    'standard_user',
      globalRole:  { role: 'user' },
      projectRole: {
        clusterId:   'local',
        projectName: 'Default',
        role:        'project-member',
      },
      password: Cypress.env('password')
    }, { createNameOptions: { onlyContext: true } });
  });
});
