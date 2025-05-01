import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetBundlesCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.bundle.po';
import FleetBundlesList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.bundle.po';

export class FleetBundlesPagePo extends PagePo {
  static url = `/c/_/fleet/fleet.cattle.io.bundle`

  constructor() {
    super(FleetBundlesPagePo.url);
  }

  goTo() {
    return cy.visit(FleetBundlesPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('Bundles');
  }

  bundlesList() {
    return new FleetBundlesList(this.path);
  }

  createBundlesForm(fleetWorkspace?: string, id?: string): FleetBundlesCreateEditPo {
    return new FleetBundlesCreateEditPo(fleetWorkspace, id);
  }
}
