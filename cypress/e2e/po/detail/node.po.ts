import PagePo from '@/cypress/e2e/po/pages/page.po';

/**
 * Details component for nodes
 */
export default class NodeDetailsPo extends PagePo {
  private static createPath(cluster: string, nodeName: string) {
    return `/c/${ cluster }/explorer/node/${ nodeName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(cluster: string, nodeName: string) {
    super(NodeDetailsPo.createPath(cluster, nodeName));
  }
}
