import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import AssignToDialogPo from '@/cypress/e2e/po/components/assign-to-dialog.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';

export class FleetClusterListPagePo extends BaseListPagePo {
    static url = `/c/_/fleet/fleet.cattle.io.cluster`

    constructor() {
      super(FleetClusterListPagePo.url);
    }

    goTo() {
      return cy.visit(FleetClusterListPagePo.url);
    }

    static navTo() {
      const fleetDashboardPage = new FleetDashboardListPagePo('_');

      FleetDashboardListPagePo.navTo();
      fleetDashboardPage.waitForPage();

      const sideNav = new ProductNavPo();

      sideNav.navToSideMenuEntryByLabel('Clusters');
    }

    selectWorkspace(workspaceName = 'fleet-local') {
      return this.header().selectWorkspace(workspaceName);
    }

    editFleetCluster(workspace: string, clusterName: string): FleetClusterEditPo {
      return new FleetClusterEditPo(workspace, clusterName);
    }

    changeWorkspaceForm(): AssignToDialogPo {
      return new AssignToDialogPo();
    }
}

export class FleetClusterDetailsPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace: string, clusterName: string) {
    return `/c/_/fleet/fleet.cattle.io.cluster/${ fleetWorkspace }/${ clusterName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string, clusterName: string) {
    super(FleetClusterDetailsPo.createPath(fleetWorkspace, clusterName));
  }

  clusterTabs(): TabbedPo {
    return new TabbedPo();
  }

  gitReposList() {
    return new ResourceTablePo('#repos [data-testid="sortable-table-list-container"]');
  }

  addRepostoryButton() {
    return this.self().get('.btn').contains('Add Repository');
  }
}

export class FleetClusterEditPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace: string, clusterName: string) {
    return `/c/_/fleet/fleet.cattle.io.cluster/${ fleetWorkspace }/${ clusterName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace = 'fleet-default', clusterName: string) {
    super(FleetClusterEditPo.createPath(fleetWorkspace, clusterName));
  }
}
