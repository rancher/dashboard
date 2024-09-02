import RoleDetailPo from '@/cypress/e2e/po/detail/role.po';
import GlobalRoleEditPo from '@/cypress/e2e/po/edit/management.cattle.io.globalrole.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

class GlobalRoleDetailComponentPo extends ResourceDetailPo {
  userCreateEditView(clusterId: string, userId?: string ) {
    return new GlobalRoleEditPo(clusterId, userId);
  }
}

export default class GlobalRoleDetailPo extends RoleDetailPo {
  constructor(clusterId = '_', roleId: string) {
    super(clusterId, 'management.cattle.io.globalrole', roleId);
  }

  detail() {
    return new GlobalRoleDetailComponentPo(this.self());
  }
}
