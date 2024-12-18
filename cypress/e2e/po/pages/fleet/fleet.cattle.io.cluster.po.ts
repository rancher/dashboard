import PagePo from '@/cypress/e2e/po/pages/page.po';
import FleetClusterList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.cluster.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetClusterEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.cluster.po';
import AssignToDialogPo from '@/cypress/e2e/po/components/assign-to-dialog.po';

export class FleetClusterListPagePo extends PagePo {
    static url = `/c/_/fleet/fleet.cattle.io.cluster`

    constructor() {
      super(FleetClusterListPagePo.url);
    }

    goTo() {
      return cy.visit(FleetClusterListPagePo.url);
    }

    static navTo() {
      const fleetDashboardPage = new FleetDashboardPagePo('_');

      FleetDashboardPagePo.navTo();
      fleetDashboardPage.waitForPage();

      const sideNav = new ProductNavPo();

      sideNav.navToSideMenuEntryByLabel('Clusters');
    }

    selectWorkspace(workspaceName = 'fleet-local') {
      return this.header().selectWorkspace(workspaceName);
    }

    clusterList() {
      return new FleetClusterList('[data-testid="sortable-table-list-container"]');
    }

    sortableTable() {
      return new FleetClusterList(this.self()).resourceTable().sortableTable();
    }

    rowActionMenuOpen(label: string) {
      return this.sortableTable().rowActionMenuOpen(label);
    }

    checkRowCount(isEmpty: boolean, expected: number) {
      this.sortableTable().checkRowCount(isEmpty, expected);
    }

    editFleetCluster(workspace: string, clusterName: string): FleetClusterEditPo {
      return new FleetClusterEditPo(workspace, clusterName);
    }

    changeWorkspaceForm(): AssignToDialogPo {
      return new AssignToDialogPo();
    }
}
