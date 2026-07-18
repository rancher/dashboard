import { RancherSetupLoginPagePo } from '@/cypress/e2e/po/pages/rancher-setup-login.po';
import { RancherSetupConfigurePage } from '@/cypress/e2e/po/pages/rancher-setup-configure.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { PARTIAL_SETTING_THRESHOLD } from '@/cypress/support/utils/settings-utils';
import { serverUrlLocalhostCases, urlWithTrailingForwardSlash, httpUrl, nonUrlCases } from '@/cypress/e2e/blueprints/global_settings/settings-data';

// Cypress or the GrepTags avoid to run multiples times the same test for each tag used.
// This is a temporary solution till initialization is not handled as a test
describe('Rancher setup', { tags: ['@adminUserSetup', '@standardUserSetup', '@setup', '@components', '@navigation', '@charts', '@explorer', '@explorer2', '@extensions', '@fleet', '@generic', '@globalSettings', '@manager', '@userMenu', '@usersAndAuths', '@elemental', '@noVai', '@virtualizationMgmt', '@accessibility'] }, () => {
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
    cy.intercept('GET', '/v1/management.cattle.io.settings?exclude=metadata.managedFields').as('settingsReq');

    rancherSetupLoginPage.goTo();

    // First request will fetch a partial list of settings.
    // This spec runs against a freshly-booted Rancher backend, so the initial settings
    // fetch can be slower than Cypress's default 5s request-timeout on a cold, loaded CI
    // runner. Give the intercept waits a generous timeout so a slow-but-healthy startup
    // doesn't read as a flake.
    cy.wait('@settingsReq', { timeout: 30000 }).then((interception) => {
      expect(interception.response.body.count).lessThan(PARTIAL_SETTING_THRESHOLD);
    });
    cy.get('@settingsReq.all').should('have.length', 1);

    rancherSetupLoginPage.waitForPage();
    rancherSetupLoginPage.bootstrapLogin();

    // Second request (after user is logged in) will return the full list
    cy.wait('@settingsReq', { timeout: 30000 }).then((interception) => {
      expect(interception.response.body.count).gte(PARTIAL_SETTING_THRESHOLD);
    });
    rancherSetupConfigurePage.waitForPage();

    // Wait for the configure page to finish rendering its initial data (server URL
    // field visible + submit gated) as a deterministic settle point — this replaces an
    // arbitrary timed wait and guarantees the app's startup request burst has completed
    // before we assert that no further settings requests were made.
    rancherSetupConfigurePage.serverUrl().self().should('be.visible');
    rancherSetupConfigurePage.submitShouldBeDisabled();
    cy.get('@settingsReq.all').should('have.length', 2);
  });

  it('Login & Configure', () => {
    cy.intercept('POST', '/v1-public/login').as('bootstrapReq');

    rancherSetupLoginPage.goTo();
    rancherSetupLoginPage.waitForPage();
    rancherSetupLoginPage.bootstrapLogin();

    // Generous timeout: the bootstrap login POST hits a cold backend on the first setup
    // request and can exceed the default 5s request-timeout on a slow CI runner.
    cy.wait('@bootstrapReq', { timeout: 30000 }).then((login) => {
      expect(login.response?.statusCode).to.equal(200);
      rancherSetupConfigurePage.waitForPage();
    });

    cy.intercept('PUT', '/v1/userpreferences/*').as('firstLoginReq');

    rancherSetupConfigurePage.waitForPage();
    rancherSetupConfigurePage.submitShouldBeDisabled();
    // Check server url validation
    rancherSetupConfigurePage.serverUrl().self().should('be.visible');
    // The server URL field is auto-populated asynchronously once the setup page hydrates.
    // Wait until it holds a non-empty value before capturing it with the non-retry-able
    // `.then()` below — otherwise we snapshot an empty string, restore the field to empty
    // at the end of the validation loop, and leave submit disabled so
    // `submitShouldBeEnabled()` times out.
    rancherSetupConfigurePage.serverUrl().self().invoke('val').should('not.be.empty');
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
    rancherSetupConfigurePage.submitShouldBeEnabled();
    rancherSetupConfigurePage.submit();

    cy.location('pathname', { timeout: 15000 }).should('include', '/home');

    cy.wait('@firstLoginReq', { timeout: 30000 }).then((login) => {
      expect(login.response?.statusCode).to.equal(200);
      homePage.waitForPage();
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
