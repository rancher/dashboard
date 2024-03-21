import Driver from '@shell/models/driver';

export default class NodeDriver extends Driver {
  get doneRoute() {
    return 'c-cluster-manager-driver-nodedriver';
  }

  get _availableActions() {
    const out = [
      {
        action:   'activate',
        label:    'Activate',
        icon:     'icon icon-play',
        bulkable: true,
        enabled:  !!this.actions.activate && this.state === 'inactive',
      },
      {
        action:   'deactivate',
        label:    'Deactivate',
        icon:     'icon icon-pause',
        bulkable: true,
        enabled:  !!this.actions.deactivate && this.state === 'active',
        weight:   -1,
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
        enabled:    !!this.links.update && !this.active,
        weight:     -10,
      }
    ];

    return out;
  }

  deactivate() {
    this.$dispatch('promptModal', {
      componentProps: { url: `v3/nodeDrivers/${ escape(this.id) }?action=deactivate`, name: this.nameDisplay },
      component:      'DeactivateDriverDialog'
    });
  }

  activate() {
    return this.$dispatch('rancher/request', {
      url:    `v3/nodeDrivers/${ escape(this.id) }?action=activate`,
      method: 'post',
    }, { root: true });
  }
}
