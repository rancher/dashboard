import PagePo from '@/cypress/e2e/po/pages/page.po';

export default class ClusterManagerNamespacePagePo extends PagePo {
  private static createPath(clusterId: string, namespace) {
    return `/c/${ clusterId }/manager/namespace/${ namespace }`;
  }

  constructor(clusterId = 'local', namespace = 'fleet-local') {
    super(ClusterManagerNamespacePagePo.createPath(clusterId, namespace));
  }

  namespace() {
    return cy.get('.masthead-resource-title');
  }
}
