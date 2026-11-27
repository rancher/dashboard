import RoleEditPo from '@/cypress/e2e/po/edit/role.po';

export default class GlobalRoleEditPo extends RoleEditPo {
  constructor(clusterId = '_', roleId?: string) {
    super(clusterId, 'management.cattle.io.globalrole', roleId);
  }
}
