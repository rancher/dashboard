import SteveModel from '@/plugins/steve/steve-class';

export default class EtcdBackup extends SteveModel {
  get _availableActions() {
    const out = this._standardActions;

    const restore = {
      action:     'promptRestore',
      enabled:    true,
      icon:       'icon icon-fw icon-backup-restore',
      label:      'Restore'
    };

    out.unshift(restore);

    return out;
  }

  promptRestore() {
    this.$dispatch('promptRestore', [this]);
  }
}
