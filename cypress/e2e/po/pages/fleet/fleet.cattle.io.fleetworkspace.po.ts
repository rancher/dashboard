import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import FleetWorkspaceList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.workspace.po';

export class FleetWorkspaceListPagePo extends PagePo {
  static url = `/c/_/fleet/management.cattle.io.fleetworkspace`

  constructor() {
    super(FleetWorkspaceListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetWorkspaceListPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('Workspaces');
  }

  workspacesList() {
    return new FleetWorkspaceList('[data-testid="sortable-table-list-container"]');
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }

  /**
   * Convenience method
   */
  sortableTable() {
    return this.workspacesList().resourceTable().sortableTable();
  }
}
