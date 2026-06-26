
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';
import { RESTART_TIMEOUT_OPT } from '~/cypress/support/utils/timeouts';

// Vai ('ui-sql-cache') is now on by default. This sets up the `noVai` test suite by disabling it

const featureFlagsPage = new FeatureFlagsPagePo('local');

describe('Disable Vai', { testIsolation: 'off', tags: ['@noVai', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('Disable Feature Flag', () => {
    const key = 'ui-sql-cache';

    // Check that the flag is not visible and the ff is enabled
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.waitForPage();
    featureFlagsPage.self().should('not.contain', key);
    cy.isVaiCacheEnabled().should('eq', true);

    // Disable the ff
    cy.getRancherResource('v1', 'management.cattle.io.features', key).then((resp) => {
      const resource = resp.body;

      delete resource.links;
      delete resource.metadata.creationTimestamp;
      delete resource.metadata.generation;
      delete resource.metadata.state;

      resource.spec.value = false;

      // Causes Rancher to restart
      cy.setRancherResource('v1', 'management.cattle.io.features', key, JSON.stringify(resource));

      // Wait for Rancher to restart
      // This is HORRIBLE, but churned on a better way
      // 1. Using the same code the UI uses to wait does not work
      //    - running in cypress repeated requests are always stuck on pending, even after rancher comes up
      //    - same applies for requests made in cypress browser
      //    - not sure why this does not also affect the UI outside of cypress
      //    - FWIW repeated requests required new cy command using `fetch` + manual timeout handling instead of `cy.request`
      //      - chainables aren't promise chains with rejection
      //      - failOnStatusCode, retryOnNetworkFailure cover other cases
      //      - cy.on error does not catch them
      // 2. With this approach we could probably be smarter (shorter wait, longer timeout on goToAndWait)
      //    - we would still be at the mercy of rancher coming up for the requests cypress browser makes to not be stuck pending
      cy.wait(RESTART_TIMEOUT_OPT.timeout); // eslint-disable-line cypress/no-unnecessary-waiting
      FeatureFlagsPagePo.goToAndWait();

      // Finally confirm ff has correct value
      cy.waitForRancherResource('v1', 'management.cattle.io.features', key, (resp) => {
        return resp?.body?.spec?.value === false;
      });
    });
  });
});
