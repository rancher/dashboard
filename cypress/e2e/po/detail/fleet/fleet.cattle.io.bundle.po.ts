import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * Details component for fleet.cattle.io.bundle resources
 */
export default class FleetBundleDetailsPo extends PagePo {
  private static createPath(fleetWorkspace: string, bundleName: string) {
    return `/c/_/fleet/fleet.cattle.io.bundle/${ fleetWorkspace }/${ bundleName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string, bundleName: string) {
    super(FleetBundleDetailsPo.createPath(fleetWorkspace, bundleName));
  }

  list() {
    return new BaseResourceList('[data-testid="sortable-table-list-container"]');
  }
}
