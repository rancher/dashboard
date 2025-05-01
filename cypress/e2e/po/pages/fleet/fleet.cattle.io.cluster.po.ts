import PagePo from '@/cypress/e2e/po/pages/page.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import FleetClusterEditPo from '@/cypress/e2e/po/edit/fleet/fleet.cattle.io.cluster.po';
import AssignToDialogPo from '@/cypress/e2e/po/components/assign-to-dialog.po';
import FleetClusterList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.cluster.po';

export class FleetClusterPagePo extends PagePo {
    static url = `/c/_/fleet/fleet.cattle.io.cluster`

    constructor() {
      super(FleetClusterPagePo.url);
    }

    goTo() {
      return cy.visit(FleetClusterPagePo.url);
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
      return new FleetClusterList(this.path);
    }

    editFleetCluster(workspace: string, clusterName: string): FleetClusterEditPo {
      return new FleetClusterEditPo(workspace, clusterName);
    }

    changeWorkspaceForm(): AssignToDialogPo {
      return new AssignToDialogPo();
    }
}
