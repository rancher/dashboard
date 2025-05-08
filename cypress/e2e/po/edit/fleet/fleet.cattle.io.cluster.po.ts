import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';

export default class FleetClusterEditPo extends BaseDetailPagePo {
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
