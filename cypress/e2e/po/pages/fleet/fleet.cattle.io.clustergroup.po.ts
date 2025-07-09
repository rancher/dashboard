import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';

export class FleetClusterGroupsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/fleet/fleet.cattle.io.clustergroup`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(FleetClusterGroupsListPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(FleetClusterGroupsListPagePo.createPath(clusterId));
  }

  static navTo() {
    const fleetDashboardPage = new FleetDashboardListPagePo('_');

    FleetDashboardListPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Cluster Groups');
  }
}

export class FleetClusterGroupsCreateEditPo extends BaseDetailPagePo {
  private static createPath(workspace?: string, id?: string ) {
    const root = `/c/_/fleet/fleet.cattle.io.clustergroup`;

    return id ? `${ root }/${ workspace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(workspace?: string, id?: string) {
    super(FleetClusterGroupsCreateEditPo.createPath(workspace, id));
  }
}

export class FleetClusterGroupDetailsPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace: string, clusterGroup: string) {
    return `/c/_/fleet/fleet.cattle.io.clustergroup/${ fleetWorkspace }/${ clusterGroup }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string, clusterName: string) {
    super(FleetClusterGroupDetailsPo.createPath(fleetWorkspace, clusterName));
  }

  groupTabs(): TabbedPo {
    return new TabbedPo();
  }

  clusterList() {
    return new ResourceTablePo('#clusters [data-testid="sortable-table-list-container"]');
  }
}
