import Driver from '@shell/models/driver';

export default class KontainerDriver extends Driver {
  get doneRoute() {
    return 'c-cluster-manager-driver-kontainerdriver';
  }

  get _availableActions() {
    const out = [
      {
        action:     'activate',
        label:      this.t('action.activate'),
        icon:       'icon icon-play',
        bulkable:   true,
        bulkAction: 'activateBulk',
        enabled:    !!this.links.update && !this.active
      },
      {
        action:     'deactivate',
        label:      this.t('action.deactivate'),
        icon:       'icon icon-pause',
        bulkable:   true,
        bulkAction: 'deactivateBulk',
        enabled:    !!this.links.update && !!this.active,
        weight:     -1
      },
      { divider: true },
      {
        action:  'viewInApi',
        enabled: true,
        icon:    'icon icon-external-link',
        label:   this.t('action.viewInApi'),
      },
      { divider: true },
      {
        action:   'goToEdit',
        label:    this.t('action.edit'),
        icon:     'icon icon-edit',
        bulkable: false,
        enabled:  !!this.links.update && !this.builtin,
      },
      {
        action:     'promptRemove',
        altAction:  'remove',
        bulkAction: 'promptRemove',
        label:      this.t('action.remove'),
        bulkable:   true,
        icon:       'icon icon-delete',
        enabled:    !!this.links.remove,
        weight:     -10,
      }
    ];

    return out;
  }

  deactivate(resources = [this]) {
    this.$dispatch('promptModal', {
      componentProps: { drivers: resources, driverType: 'kontainerDrivers' },
      component:      'DeactivateDriverDialog'
    });
  }

  deactivateBulk(resources) {
    this.$dispatch('promptModal', {
      componentProps: { drivers: resources, driverType: 'kontainerDrivers' },
      component:      'DeactivateDriverDialog'
    });
  }

  activate() {
    return this.$dispatch('rancher/request', {
      url:    `v3/kontainerDrivers/${ escape(this.id) }?action=activate`,
      method: 'post',
    }, { root: true }).catch((err) => {
      this.$dispatch('growl/fromError', { title: this.t('drivers.error.activate', { name: this.nameDisplay }), err }, { root: true });
    });
  }

  async activateBulk(resources) {
    await Promise.all(resources.map((resource) => this.$dispatch('rancher/request', {
      url:    `v3/kontainerDrivers/${ escape(resource.id) }?action=activate`,
      method: 'post',
    }, { root: true }).catch((err) => {
      this.$dispatch('growl/fromError', { title: this.t('drivers.error.activate', { name: resource.nameDisplay }), err }, { root: true });
    })));
  }
}
