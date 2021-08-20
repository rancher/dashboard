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
};
