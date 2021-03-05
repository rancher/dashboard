
const BASE = 'user-base';
const USER = 'user';
const ADMIN = 'admin';
const SPECIAL = [BASE, ADMIN, USER];

export default {
  nameDisplay() {
    return this.$rootGetters['i18n/withFallback'](`rbac.globalRoles.role.${ this.id }.label`, this.displayName || this.metadata?.name || this.id);
  },

  description() {
    return this.$rootGetters['i18n/withFallback'](`rbac.globalRoles.role.${ this.id }.description`, this.t(`rbac.globalRoles.unknownRole.description`));
  },

  isSpecial() {
    return SPECIAL.includes(this.id);
  },

};
