import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { clone } from '@shell/utils/object';
import Principal from './principal';

export default class Group extends Principal {
  get canViewInApi() {
    return false;
  }

  get nameDisplay() {
    return this.principalNameDisplay;
  }

  get principalNameDisplay() {
    const principal = this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, this.id);

    return `${ principal.name } (${ principal.displayType })`;
  }

  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.id = this.id; // Base fn removes part of the id (`github_team://3375666` --> `3375666`)

    return detailLocation;
  }

  get globalRoleBindings() {
    return this.$rootGetters['management/all'](MANAGEMENT.GLOBAL_ROLE_BINDING)
      .filter((globalRoleBinding) => this.id === globalRoleBinding.groupPrincipalName);
  }

  get _availableActions() {
    return [
      {
        action:  'goToEdit',
        label:   this.t('action.edit'),
        icon:    'icon icon-edit',
        enabled: true,
      },
      {
        action:     'promptUnassignGroupRoles',
        altAction:  'unassignGroupRoles',
        label:      this.t('action.unassign'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    !!this.globalRoleBindings.length,
        bulkAction: 'unassignGroupRoles',
      },
    ];
  }

  promptUnassignGroupRoles(resources = this) {
    const principals = Array.isArray(resources) ? resources : [resources];
    const globalRoleBindings = this.$rootGetters['management/all'](MANAGEMENT.GLOBAL_ROLE_BINDING)
      .filter((globalRoleBinding) => principals.find((principal) => principal.id === globalRoleBinding.groupPrincipalName));

    this.$dispatch('promptRemove', globalRoleBindings);
  }

  async unassignGroupRoles(resources = this) {
    const principals = Array.isArray(resources) ? resources : [resources];
    const globalRoleBindings = this.$rootGetters['management/all'](MANAGEMENT.GLOBAL_ROLE_BINDING)
      .filter((globalRoleBinding) => principals.find((principal) => principal.id === globalRoleBinding.groupPrincipalName));

    await Promise.all(globalRoleBindings.map((resource) => resource.remove()));

    // There is no dialog to close, but this can be watched and used to refresh the group principles
    this.$dispatch('promptRemove', null);
  }
}
