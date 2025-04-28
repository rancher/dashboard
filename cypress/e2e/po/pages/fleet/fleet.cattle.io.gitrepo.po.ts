import PagePo from '@/cypress/e2e/po/pages/page.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export class FleetGitRepoListPagePo extends PagePo {
  static url = `/c/_/fleet/fleet.cattle.io.gitrepo`

  constructor() {
    super(FleetGitRepoListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetGitRepoListPagePo.url);
  }

  navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Git Repos');

    this.sharedComponents().list().checkVisible();
  }

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }
}
