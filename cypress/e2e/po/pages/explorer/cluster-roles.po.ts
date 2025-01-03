import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export class ClusterRolesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/rbac.authorization.k8s.io.clusterrole`;
  }

  urlPath(clusterId = 'local') {
    return ClusterRolesPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterRolesPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(ClusterRolesPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreate() {
    return this.list().masthead().create();
  }
}
