import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetClusterGroupsCreateEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.clustergroup.po';
import FleetClusterGroupsList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.clustergroup';

export class FleetClusterGroupsListPagePo extends PagePo {
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
    const fleetDashboardPage = new FleetDashboardPagePo('_');

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();

    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Cluster Groups');
  }

  clusterGroupsList() {
    return new FleetClusterGroupsList(this.path);
  }

  createFleetClusterGroupsForm(workspace?: string, id? : string): FleetClusterGroupsCreateEditPo {
    return new FleetClusterGroupsCreateEditPo(this.clusterId, workspace, id);
  }
}
