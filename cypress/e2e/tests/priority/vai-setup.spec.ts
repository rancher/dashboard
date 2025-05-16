
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';

const featureFlagsPage = new FeatureFlagsPagePo('local');

describe('Setup Vai', { testIsolation: 'off', tags: ['@vai', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('Enable Feature Flag', () => {
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.waitForPage();

    featureFlagsPage.list().details('ui-sql-cache', 0).should('include.text', 'Disabled');

    featureFlagsPage.list().clickRowActionMenuItem('ui-sql-cache', 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', 'ui-sql-cache', true, { waitForModal: true, waitForRequest: true });

    featureFlagsPage.list().details('ui-sql-cache', 0).should('include.text', 'Active');
  });
});
