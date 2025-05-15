
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { PerformancePagePo } from '@/cypress/e2e/po/pages/global-settings/performance.po';
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';
import { promptModal } from '@/cypress/e2e/po/prompts/shared/promptInstances.po';

const performancePage = new PerformancePagePo('local');
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

  it('Enable Performance Setting', () => {
    // Sometimes the setting resource isn't available yet..... so wait until it is before trying to set it
    cy.waitForRancherResource(
      'v1',
      'schema',
      'management.cattle.io.settings',
      (resp) => resp?.body?.id === 'management.cattle.io.setting',
      20,
      { failOnStatusCode: false }
    );

    PerformancePagePo.navTo();
    performancePage.waitForPage();

    performancePage.serverSidePaginationCheckbox().checkVisible();
    performancePage.serverSidePaginationCheckbox().isUnchecked();

    performancePage.serverSidePaginationCheckbox().set();

    promptModal().checkVisible();
    promptModal().submit('Continue');

    performancePage.serverSidePaginationCheckbox().isChecked();

    performancePage.applyButton().click();

    // Should validate that the setting is correctly applied, however this whole block us due to be removed in https://github.com/rancher/dashboard/pull/14086
  });
});
