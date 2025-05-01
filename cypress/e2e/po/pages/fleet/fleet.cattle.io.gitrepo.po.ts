import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { GitRepoCreateEditPo } from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.gitrepo.po';
import FleetGitRepoList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.gitrepo.po';

export class FleetGitRepoPagePo extends PagePo {
  static url = `/c/_/fleet/fleet.cattle.io.gitrepo`

  constructor() {
    super(FleetGitRepoPagePo.url);
  }

  goTo() {
    return cy.visit(FleetGitRepoPagePo.url);
  }

  navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Git Repos');

    this.gitRepoList().checkVisible();
  }

  gitRepoList() {
    return new FleetGitRepoList(this.path);
  }

  createGitRepoForm(fleetWorkspace?: string, gitRepoName?: string): GitRepoCreateEditPo {
    return new GitRepoCreateEditPo(fleetWorkspace, gitRepoName);
  }
}
