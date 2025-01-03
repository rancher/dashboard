import PagePo from '@/cypress/e2e/po/pages/page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * Details component for fleet.cattle.io.fleetworkspace resources
 */
export default class FleetWorkspaceDetailsPo extends PagePo {
  private static createPath(fleetWorkspace: string) {
    return `/c/_/fleet/management.cattle.io.fleetworkspace/${ fleetWorkspace }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string) {
    super(FleetWorkspaceDetailsPo.createPath(fleetWorkspace));
  }

  workspaceTabs(): TabbedPo {
    return new TabbedPo();
  }

  recentEventsList() {
    return new BaseResourceList('#events [data-testid="sortable-table-list-container"]');
  }

  relatedResourcesList(index: number) {
    return new BaseResourceList(`#related div:nth-of-type(${ index })[data-testid="sortable-table-list-container"]`);
  }
}
