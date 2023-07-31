import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import GlobalRoleEditPo from '@/cypress/e2e/po/edit/management.cattle.io.globalrole.po';
import RoleTemplateEditPo from '@/cypress/e2e/po/edit/management.cattle.io.roletemplate.po';
import GlobalRoleDetailPo from '@/cypress/e2e/po/detail/management.cattle.io.globalrole.po';
import RoleTemplateDetailPo from '@/cypress/e2e/po/detail/management.cattle.io.roletemplate.po';
import RoleListPo from '@/cypress/e2e/po/lists/role-list.po';

export default class RolesPo extends PagePo {
  private static createPath(clusterId: string) {
    // return (roleId ? `/c/${ clusterId }/auth/roles/${ resource }/${ roleId }` : `/c/${ clusterId }/auth/roles${ resource }`);
    return `/c/${ clusterId }/auth/roles`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(private clusterId = '_') {
    super(RolesPo.createPath(clusterId));
  }

  waitForRequests() {
    RolesPo.goToAndWaitForGet(this.goTo.bind(this), ['/v1/management.cattle.io.roletemplates?exclude=metadata.managedFields']);
  }

  createGlobal(userId?: string) {
    return new GlobalRoleEditPo(this.clusterId, userId);
  }

  detailGlobal(roleId: string) {
    return new GlobalRoleDetailPo(this.clusterId, roleId);
  }

  createRole(userId?: string) {
    return new RoleTemplateEditPo(this.clusterId, userId);
  }

  detailRole(roleId: string) {
    return new RoleTemplateDetailPo(this.clusterId, roleId);
  }

  listCreate(label: string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.masthead().actions().contains(label)
      .click();
  }

  list() {
    return new RoleListPo(this.self());
  }
}
