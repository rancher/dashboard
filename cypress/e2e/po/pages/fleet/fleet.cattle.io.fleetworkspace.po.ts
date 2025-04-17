import PagePo from '@/cypress/e2e/po/pages/page.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetWorkspaceCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.fleetworkspace.po';

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

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }

  createWorkspaceForm(fleetWorkspace?: string): FleetWorkspaceCreateEditPo {
    return new FleetWorkspaceCreateEditPo(fleetWorkspace);
  }
}
