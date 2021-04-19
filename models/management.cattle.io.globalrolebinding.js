import { NORMAN, MANAGEMENT } from '@/config/types';

export default {
  nameDisplay() {
    const role = this.$getters['byId'](MANAGEMENT.GLOBAL_ROLE, this.globalRoleName);

    if (!role) {
      return this.globalRoleName;
    }

    const ownersName = this.groupPrincipalName ? this._displayPrincipal : this._displayUser;

    return ownersName ? `${ role.displayName } (${ ownersName })` : role.displayName;
  },

  _displayPrincipal() {
    const principal = this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, this.groupPrincipalName);

    return principal ? `${ principal.name } - ${ principal.displayType }` : null;
  },

  _displayUser() {
    return this.user;
  },

};
