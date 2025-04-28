import PagePo from '@/cypress/e2e/po/pages/page.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetBundlesCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.bundle.po';

export class FleetBundlesListPagePo extends PagePo {
  static url = `/c/_/fleet/fleet.cattle.io.bundle`

  constructor() {
    super(FleetBundlesListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetBundlesListPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('Bundles');
  }

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }

  createBundlesForm(fleetWorkspace?: string, id?: string): FleetBundlesCreateEditPo {
    return new FleetBundlesCreateEditPo(fleetWorkspace, id);
  }
}
