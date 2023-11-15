import PagePo from '@/cypress/e2e/po/pages/page.po';
import NodesListPo from '@/cypress/e2e/po/lists/nodes-list.po';

export class NodesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/node`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(NodesPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(NodesPagePo.createPath(clusterId));
  }

  nodesList(): NodesListPo {
    return new NodesListPo('[data-testid="cluster-list-container"]');
  }
}
