import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

export class FleetGitRepoRestrictionListPagePo extends BaseListPagePo {
  static url = `/c/_/fleet/fleet.cattle.io.gitreporestriction`;

  constructor() {
    super(FleetGitRepoRestrictionListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetGitRepoRestrictionListPagePo.url);
  }

  /**
   * Deprecation banner shown at the top of the GitRepoRestriction list page
   */
  deprecationBanner(): BannersPo {
    return new BannersPo('[data-testid="git-repo-restriction-deprecation-banner"]');
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardListPagePo('_');

    FleetDashboardListPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Resources');
    sideNav.navToSideMenuEntryByLabel('GitRepoRestrictions');
  }
}

export class FleetRestrictionCreateEditPo extends BaseDetailPagePo {
  private static createPath(workspace?: string, id?: string ) {
    const root = `/c/_/fleet/fleet.cattle.io.gitreporestriction`;

    return id ? `${ root }/${ workspace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(workspace?: string, id?: string) {
    super(FleetRestrictionCreateEditPo.createPath(workspace, id));
  }
}
