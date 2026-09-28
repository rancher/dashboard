import { FleetPolicyListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.policy.po';
import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

describe('Fleet Policy', { testIsolation: false, tags: ['@fleet', '@adminUser'] }, () => {
  const fleetPolicyListPage = new FleetPolicyListPagePo();
  const fleetDashboardPage = new FleetDashboardListPagePo('_');

  before(() => {
    cy.login();
  });

  it('should be listed as a resource in the Fleet product navigation', () => {
    FleetDashboardListPagePo.goTo('_');
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Resources');

    FleetPolicyListPagePo.navEntry().should('exist').and('be.visible');
  });

  it('should navigate to the Fleet Policy list page from the nav', () => {
    FleetPolicyListPagePo.navTo();

    fleetPolicyListPage.waitForPage();
    // Assert the list actually rendered: the resource-not-found page also has a (non-empty) masthead.
    fleetPolicyListPage.baseResourceList().masthead().title()
      .should('contain', 'Policies');
    fleetPolicyListPage.list().resourceTable().checkExists();
  });
});
