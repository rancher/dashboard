
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';

const featureFlagsPage = new FeatureFlagsPagePo('local');

/**
 * OIDC Provider Setup Test
 *
 * This test enables the OIDC Provider feature flag.
 * It's designed to run in Jenkins CI environment as part of the test setup process.
 */
describe('Enable OIDC Provider', { testIsolation: 'off', tags: ['@jenkins', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('Enable Feature Flag', () => {
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.waitForPage();

    featureFlagsPage.list().details('oidc-provider', 0).should('include.text', 'Disabled');

    featureFlagsPage.list().clickRowActionMenuItem('oidc-provider', 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', 'oidc-provider', true, { waitForModal: true, waitForRequest: true });

    featureFlagsPage.list().details('oidc-provider', 0).should('include.text', 'Active');
  });
});
