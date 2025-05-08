import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetRestrictionCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.gitreporestriction.po';
import FleetGitRepoRestrictionList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.gitreporestriction.po';

export class FleetGitRepoRestrictionPagePo extends PagePo {
  static url = `/c/_/fleet/fleet.cattle.io.gitreporestriction`

  constructor() {
    super(FleetGitRepoRestrictionPagePo.url);
  }

  goTo() {
    return cy.visit(FleetGitRepoRestrictionPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('GitRepoRestrictions');
  }

  restrictionList() {
    return new FleetGitRepoRestrictionList(this.path);
  }

  createRestrictionForm(fleetWorkspace?: string, id?: string): FleetRestrictionCreateEditPo {
    return new FleetRestrictionCreateEditPo(fleetWorkspace, id);
  }
}
