import PagePo from '@/cypress/e2e/po/pages/page.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';

export default class FleetClusterEditPo extends PagePo {
  private static createPath(fleetWorkspace: string, clusterName: string) {
    return `/c/_/fleet/fleet.cattle.io.cluster/${ fleetWorkspace }/${ clusterName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace = 'fleet-default', clusterName: string) {
    super(FleetClusterEditPo.createPath(fleetWorkspace, clusterName));
  }

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }
}
