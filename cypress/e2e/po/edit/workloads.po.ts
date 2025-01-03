import PagePo from '@/cypress/e2e/po/pages/page.po';

export default class WorkloadsCreateEditPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/storage.k8s.io.storageclass/create`;

    return id ? `${ root }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', id?: string) {
    super(WorkloadsCreateEditPo.createPath(clusterId, id));
  }

  errorBanner() {
    return cy.get('#cru-errors');
  }
}
