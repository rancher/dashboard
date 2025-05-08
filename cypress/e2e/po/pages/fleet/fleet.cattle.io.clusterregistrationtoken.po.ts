import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetTokensCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.clusterregistrationtoken.po';
import FleetClusterRegistrationTokensList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.clusterregistrationtoken.po';

export class FleetClusterRegistrationTokenPagePo extends PagePo {
  static url = `/c/_/fleet/fleet.cattle.io.clusterregistrationtoken`

  constructor() {
    super(FleetClusterRegistrationTokenPagePo.url);
  }

  goTo() {
    return cy.visit(FleetClusterRegistrationTokenPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('Cluster Registration Tokens');
  }

  tokenList() {
    return new FleetClusterRegistrationTokensList(this.path);
  }

  createTokenForm(fleetWorkspace?: string, id?: string): FleetTokensCreateEditPo {
    return new FleetTokensCreateEditPo(fleetWorkspace, id);
  }
}
