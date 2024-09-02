import RoleEditPo from '@/cypress/e2e/po/edit/role.po';

export default class RoleTemplateEditPo extends RoleEditPo {
  constructor(clusterId = '_', roleId?: string) {
    super(clusterId, 'management.cattle.io.roletemplate', roleId);
  }
}
