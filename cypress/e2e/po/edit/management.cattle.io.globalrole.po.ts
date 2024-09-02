import RoleEditPo from '@/cypress/e2e/po/edit/role.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';

export default class GlobalRoleEditPo extends RoleEditPo {
  constructor(clusterId = '_', roleId?: string) {
    super(clusterId, 'management.cattle.io.globalrole', roleId);
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}
