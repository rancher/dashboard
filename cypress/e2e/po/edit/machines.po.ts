import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class MachinesCreateEditPo extends PagePo {
  private static createPath(clusterId: string, nsName?: string, machineName?: string ) {
    const root = `/c/${ clusterId }/manager/cluster.x-k8s.io.machine`;

    return nsName && machineName ? `${ root }/${ nsName }/${ machineName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', nsName?: string, machineName?: string) {
    super(MachinesCreateEditPo.createPath(clusterId, nsName, machineName));
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }
}
