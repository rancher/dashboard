import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetWorkspaceCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.fleetworkspace.po';
import FleetWorkspaceList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.workspace.po';

export class FleetWorkspacePagePo extends PagePo {
  static url = `/c/_/fleet/management.cattle.io.fleetworkspace`

  constructor() {
    super(FleetWorkspacePagePo.url);
  }

  goTo() {
    return cy.visit(FleetWorkspacePagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('Workspaces');
  }

  workspaceList() {
    return new FleetWorkspaceList(this.path);
  }

  createWorkspaceForm(fleetWorkspace?: string): FleetWorkspaceCreateEditPo {
    return new FleetWorkspaceCreateEditPo(fleetWorkspace);
  }
}
