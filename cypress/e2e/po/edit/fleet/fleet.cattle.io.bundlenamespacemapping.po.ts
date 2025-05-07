import PagePo from '@/cypress/e2e/po/pages/page.po';

export default class FleetBundleNsMappingCreateEditPo extends PagePo {
  private static createPath(workspace?: string, id?: string ) {
    const root = `/c/_/fleet/fleet.cattle.io.bundlenamespacemapping`;

    return id ? `${ root }/${ workspace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(workspace?: string, id?: string) {
    super(FleetBundleNsMappingCreateEditPo.createPath(workspace, id));
  }
}
