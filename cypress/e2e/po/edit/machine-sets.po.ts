import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
export default class MachineSetsCreateEditPo extends PagePo {
  private static createPath(clusterId: string, nsName?: string, machineSetName?: string ) {
    const root = `/c/${ clusterId }/manager/cluster.x-k8s.io.machineset`;

    return nsName && machineSetName ? `${ root }/${ nsName }/${ machineSetName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', nsName?: string, machineSetName?: string) {
    super(MachineSetsCreateEditPo.createPath(clusterId, nsName, machineSetName));
  }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }
}
