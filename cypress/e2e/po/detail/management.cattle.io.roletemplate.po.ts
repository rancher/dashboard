import RoleDetailPo from '@/cypress/e2e/po/detail/role.po';
import RoleTemplateEditPo from '@/cypress/e2e/po/edit/management.cattle.io.roletemplate.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

class RoleTemplateDetailComponentPo extends ResourceDetailPo {
  userCreateEditView(clusterId: string, userId?: string ) {
    return new RoleTemplateEditPo(clusterId, userId);
  }
}

export default class RoleTemplateDetailPo extends RoleDetailPo {
  constructor(clusterId = '_', roleId: string) {
    super(clusterId, 'management.cattle.io.roletemplate', roleId);
  }

  detail() {
    return new RoleTemplateDetailComponentPo(this.self());
  }
}
