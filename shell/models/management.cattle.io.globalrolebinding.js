import { NORMAN, MANAGEMENT } from '@shell/config/types';
import HybridModel from '@shell/plugins/steve/hybrid-class';

export default class GRB extends HybridModel {
  get nameDisplay() {
    const role = this.$getters['byId'](MANAGEMENT.GLOBAL_ROLE, this.globalRoleName);

    if (!role) {
      return this.globalRoleName;
    }

    const ownersName = this.groupPrincipalName ? this._displayPrincipal : this._displayUser;

    return ownersName ? `${ role.displayName } (${ ownersName })` : role.displayName;
  }

  get _displayPrincipal() {
    const principal = this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, this.groupPrincipalName);

    return principal ? `${ principal.name } - ${ principal.displayType }` : null;
  }

  get _displayUser() {
    return this.user;
  }

  get basicNorman() {
    if (this.id) {
      return this.$dispatch(`rancher/find`, { id: this.id, type: NORMAN.GLOBAL_ROLE_BINDING }, { root: true });
    }

    return this.$dispatch(`rancher/create`, { type: NORMAN.GLOBAL_ROLE_BINDING, name: this.displayName }, { root: true });
  }

  get norman() {
    return (async() => {
      const norman = await this.basicNorman;

      norman.globalRoleId = this.globalRoleName;
      norman.userId = this.userName;
      norman.newUserDefault = this.newUserDefault;
      norman.groupPrincipalId = this.groupPrincipalName;

      return norman;
    })();
  }

  async save() {
    const norman = await this.norman;

    return norman.save();
  }

  async remove() {
    const norman = await this.norman;

    await norman.remove();
  }
}
