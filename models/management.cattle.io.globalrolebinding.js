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

  basicNorman() {
    if (this.id) {
      return this.$dispatch(`rancher/find`, { id: this.id, type: NORMAN.GLOBAL_ROLE_BINDING }, { root: true });
    }

    return this.$dispatch(`rancher/create`, { type: NORMAN.GLOBAL_ROLE_BINDING, name: this.displayName }, { root: true });
  },

  async norman() {
    const norman = await this.basicNorman;

    norman.globalRoleId = this.globalRoleName;
    norman.userId = this.userName;
    norman.groupPrincipalId = this.groupPrincipalName;

    return norman;
  },

  save() {
    return async() => {
      const norman = await this.norman;

      return norman.save();
    };
  },

  remove() {
    return async() => {
      const norman = await this.norman;

      await norman.remove();
    };
  }

};
