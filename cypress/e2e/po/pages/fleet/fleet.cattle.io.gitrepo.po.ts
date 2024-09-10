import PagePo from '@/cypress/e2e/po/pages/page.po';
import FleetGitRepoList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.gitrepo.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';

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

    this.repoList().checkVisible();
  }

  repoList() {
    return new FleetGitRepoList(this.self());
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }

  resourceTable() {
    return new ResourceTablePo(this.self());
  }
}
