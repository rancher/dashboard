import { NORMAN } from '@shell/config/types';
import HybridModel from '@shell/plugins/steve/hybrid-class';
import { _getNameDisplay, _getDisplayPrincipal } from '@shell/plugins/steve/resourceUtils/management.cattle.io.globalrolebinding';

export default class GRB extends HybridModel {
  get nameDisplay() {
    return _getNameDisplay(this, this.$getters, this.$rootGetters);
  }

  get _displayPrincipal() {
    return _getDisplayPrincipal(this, this.$getters, this.$rootGetters);
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
