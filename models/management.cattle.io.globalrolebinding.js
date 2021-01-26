import { NORMAN, RBAC } from '@/config/types';

export default {
  nameDisplay() {
    const roleName = this.$getters['byId'](RBAC.GLOBAL_ROLE, this.globalRoleName);

    const ownersName = this.groupPrincipalName ? this._displayPrincipal : this._displayUser;

    return `${ roleName.displayName } (${ ownersName })` ;
  },

  _displayPrincipal() {
    const principal = this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, this.groupPrincipalName);

    return `${ principal.name } - ${ principal.displayType }`;
  },

  _displayUser() {
    return this.user;
  }
};
