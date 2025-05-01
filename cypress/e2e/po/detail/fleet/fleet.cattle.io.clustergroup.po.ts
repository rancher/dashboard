import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import FleetClusterList from '@/cypress/e2e/po/lists/fleet/fleet.cattle.io.cluster.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';

/**
 * Details component for fleet.cattle.io.clustergroup resources
 */
export default class FleetClusterGroupDetailsPo extends BaseDetailPagePo {
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
    return new FleetClusterList(this.path, '#clusters [data-testid="sortable-table-list-container"]');
  }
}
