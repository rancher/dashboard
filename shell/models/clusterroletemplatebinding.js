import { MANAGEMENT } from '@shell/config/types';
import NormanModel from '@shell/plugins/steve/norman-class';

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

  get clusterroletemplatebinding() {
    return this.$rootGetters[`management/byId`](MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING, this.id?.replace(':', '/'));
  }
}
