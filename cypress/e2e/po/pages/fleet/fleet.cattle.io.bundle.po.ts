import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';

export class FleetBundlesListPagePo extends BaseListPagePo {
  static url = `/c/_/fleet/fleet.cattle.io.bundle`

  constructor() {
    super(FleetBundlesListPagePo.url);
  }

  goTo() {
    return cy.visit(FleetBundlesListPagePo.url);
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardListPagePo('_');

    FleetDashboardListPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuGroupByLabel('Resources');
    sideNav.navToSideMenuEntryByLabel(/^Bundles$/);
  }
}

export class FleetBundlesCreateEditPo extends BaseDetailPagePo {
  private static createPath(workspace?: string, id?: string ) {
    const root = `/c/_/fleet/fleet.cattle.io.bundle`;

    return id ? `${ root }/${ workspace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(workspace?: string, id?: string) {
    super(FleetBundlesCreateEditPo.createPath(workspace, id));
  }
}

export class FleetBundleDetailsPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace: string, bundleName: string) {
    return `/c/_/fleet/fleet.cattle.io.bundle/${ fleetWorkspace }/${ bundleName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string, bundleName: string) {
    super(FleetBundleDetailsPo.createPath(fleetWorkspace, bundleName));
  }

  resourcesList() {
    return new ResourceTablePo(this.self());
  }
}
