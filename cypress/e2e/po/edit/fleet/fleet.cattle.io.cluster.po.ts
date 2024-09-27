import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '~/cypress/e2e/po/components/async-button.po';
import NameNsDescription from '~/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '~/cypress/e2e/po/edit/resource-detail.po';

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

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }

  saveButton() {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
