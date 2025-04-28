import PagePo from '@/cypress/e2e/po/pages/page.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetRestrictionCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.gitreporestriction.po';

export class FleetGitRepoRestrictionListPagePo extends PagePo {
  static url = `/c/_/fleet/fleet.cattle.io.gitreporestriction`

  constructor() {
    super(FleetGitRepoRestrictionListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetGitRepoRestrictionListPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('GitRepoRestrictions');
  }

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }

  createRestrictionForm(fleetWorkspace?: string, id?: string): FleetRestrictionCreateEditPo {
    return new FleetRestrictionCreateEditPo(fleetWorkspace, id);
  }
}
