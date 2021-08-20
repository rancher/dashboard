import { MANAGEMENT } from '@/config/types';

export default {
  principalId() {
    return this.userPrincipalId || this.groupPrincipalId;
  },

  roleDisplay() {
    return this.roleTemplate.nameDisplay;
  },

  roleDescription() {
    return this.roleTemplate.description;
  },

  roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateId);
  },
  steve() {
    return this.$dispatch(`management/find`, {
      type: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      id:   this.id?.replace(':', '/')
    }, { root: true });
  },
};
