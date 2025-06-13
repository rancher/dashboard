
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';

// Vai ('ui-sql-cache') is now on by default. This sets up the `noVai` test suite by disabling it

const featureFlagsPage = new FeatureFlagsPagePo('local');

describe('Disable Vai', { testIsolation: 'off', tags: ['@noVai', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('Disable Feature Flag', () => {
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.waitForPage();

    featureFlagsPage.list().details('ui-sql-cache', 0).should('include.text', 'Active');

    featureFlagsPage.list().clickRowActionMenuItem('ui-sql-cache', 'Deactivate');
    featureFlagsPage.clickCardActionButtonAndWait('Deactivate', 'ui-sql-cache', false, { waitForModal: true, waitForRequest: true });

    featureFlagsPage.list().details('ui-sql-cache', 0).should('include.text', 'Disabled');
  });
});
