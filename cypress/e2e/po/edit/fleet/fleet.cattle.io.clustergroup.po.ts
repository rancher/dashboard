import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';

export default class FleetClusterGroupsCreateEditPo extends BaseDetailPagePo {
  private static createPath(clusterId: string, workspace?: string, id?: string ) {
    const root = `/c/${ clusterId }/fleet/fleet.cattle.io.clustergroup`;

    return id ? `${ root }/${ workspace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', workspace?: string, id?: string) {
    super(FleetClusterGroupsCreateEditPo.createPath(clusterId, workspace, id));
  }
}
