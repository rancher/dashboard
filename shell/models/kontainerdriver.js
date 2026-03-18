import Driver from '@shell/models/driver';

export default class KontainerDriver extends Driver {
  get doneRoute() {
    return 'c-cluster-manager-driver-kontainerdriver';
  }

  get _availableActions() {
    const out = [
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

  get isEmber() {
    return !this.builtIn && !this.builtin;
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
}
