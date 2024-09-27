import PagePo from '@/cypress/e2e/po/pages/page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import FleetClusterList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.cluster.po';

/**
 * Details component for fleet.cattle.io.clustergroup resources
 */
export default class FleetClusterGroupDetailsPo extends PagePo {
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
    return new FleetClusterList('#clusters [data-testid="sortable-table-list-container"]');
  }
}
