import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';

export class FleetPolicyListPagePo extends BaseListPagePo {
  static url = `/c/_/fleet/fleet.cattle.io.policy`;

  constructor() {
    super(FleetPolicyListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetPolicyListPagePo.url);
  }

  /**
   * The Fleet Policy entry within the product side nav "Resources" group.
   * Located by its resource href so the test doesn't depend on the (backend derived) nav label.
   */
  static navEntry(): Cypress.Chainable {
    const sideNav = new ProductNavPo();

    return sideNav.self().find(`a[href$="${ FleetPolicyListPagePo.url }"]`);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardListPagePo('_');

    FleetDashboardListPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Resources');

    return FleetPolicyListPagePo.navEntry().click();
  }
}
