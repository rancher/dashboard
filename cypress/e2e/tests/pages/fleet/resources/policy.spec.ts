import { FleetPolicyListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.policy.po';
import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

describe('Fleet Policy', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetPolicyListPage = new FleetPolicyListPagePo();

  before(() => {
    cy.login();
  });

  it('should be listed as a resource in the Fleet product navigation', () => {
    FleetDashboardListPagePo.goTo('_');
    new FleetDashboardListPagePo('_').waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Resources');

    FleetPolicyListPagePo.navEntry().should('exist').and('be.visible');
  });

  it('should navigate to the Fleet Policy list page from the nav', () => {
    FleetPolicyListPagePo.navTo();

    fleetPolicyListPage.waitForPage();
    cy.url().should('include', '/fleet/fleet.cattle.io.policy');
    fleetPolicyListPage.baseResourceList().masthead().title().should('not.be.empty');
  });
});
