import { MANAGEMENT, NORMAN } from '@/config/types';
import { clone } from '@/utils/object';
import principal from './principal';

export default {

  ...principal,

  canViewInApi() {
    return false;
  },

  nameDisplay() {
    return this.principalNameDisplay;
  },

  principalNameDisplay() {
    const principal = this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, this.id);

    return `${ principal.name } (${ principal.displayType })`;
  },

  detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.id = this.id; // Base fn removes part of the id (`github_team://3375666` --> `3375666`)

    return detailLocation;
  },

  globalRoleBindings() {
    return this.$rootGetters['management/all'](MANAGEMENT.GLOBAL_ROLE_BINDING)
      .filter(globalRoleBinding => this.id === globalRoleBinding.groupPrincipalName);
  },

  availableActions() {
    return [
      {
        action:  'goToEdit',
        label:   this.t('action.edit'),
        icon:    'icon icon-edit',
        enabled:  true,
      },
      {
        action:     'unassignGroupRoles',
        label:      this.t('action.unassign'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    !!this.globalRoleBindings.length,
        bulkAction: 'unassignGroupRoles',
      },
    ];
  },

  unassignGroupRoles() {
    return (resources = this) => {
      const principals = Array.isArray(resources) ? resources : [resources];

      const globalRoleBindings = this.$rootGetters['management/all'](MANAGEMENT.GLOBAL_ROLE_BINDING)
        .filter(globalRoleBinding => principals.find(principal => principal.id === globalRoleBinding.groupPrincipalName));

      this.$dispatch('promptRemove', globalRoleBindings);
    };
  },

};
