import { MANAGEMENT } from '@/config/types';
import NormanModel from '@/plugins/steve/norman-class';

export default class CRTB extends NormanModel {
  get principalId() {
    return this.userPrincipalId || this.groupPrincipalId;
  }

  get roleDisplay() {
    return this.roleTemplate.nameDisplay;
  }

  get roleDescription() {
    return this.roleTemplate.description;
  }

  get roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateId);
  }

  get steve() {
    return this.$dispatch(`management/find`, {
      type: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      id:   this.id?.replace(':', '/')
    }, { root: true });
  }
}
