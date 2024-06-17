import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import FleetBundlesList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.bundle.po';

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

  bundlesList() {
    return new FleetBundlesList('[data-testid="sortable-table-list-container"]');
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }

  resourceTable() {
    return new ResourceTablePo(this.self());
  }
}
