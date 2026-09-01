import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export class RoleBindingsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/rbac.authorization.k8s.io.rolebinding`;
  }

  urlPath(clusterId = 'local') {
    return RoleBindingsPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RoleBindingsPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(RoleBindingsPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreate() {
    return this.list().masthead().createYaml();
  }
}
