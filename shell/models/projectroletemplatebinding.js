import { MANAGEMENT, NORMAN } from '@shell/config/types';
import NormanModel from '@shell/plugins/steve/norman-class';

export default class PRTB extends NormanModel {
  get principalId() {
    return this.userPrincipalId || this.groupPrincipalId;
  }

  get roleDisplay() {
    return this.roleTemplate?.nameDisplay;
  }

  get roleDescription() {
    return this.roleTemplate?.description;
  }

  get roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateId);
  }

  get steve() {
    return this.$dispatch(`management/find`, {
      type: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
      id:   this.id?.replace(':', '/')
    }, { root: true });
  }

  get syncPrincipal() {
    return this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, this.principalId);
  }

  get nameDisplay() {
    return this.syncPrincipal?.nameDisplay || super.nameDisplay;
  }
}
