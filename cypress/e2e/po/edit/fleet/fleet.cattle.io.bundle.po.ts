import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';

export default class FleetBundlesCreateEditPo extends BaseDetailPagePo {
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
