import NormanModel from '@shell/plugins/steve/norman-class';

export default class Rke1EtcdBackup extends NormanModel {
  get _availableActions() {
    const restore = {
      action:  'promptRestore',
      enabled: true,
      icon:    'icon icon-fw icon-backup-restore',
      label:   'Restore'
    };

    const baseActions = super._availableActions;
    const actions = [
      restore
    ];

    if (baseActions.length) {
      actions.push({ divider: true });
      actions.push(...baseActions);
    }

    return actions;
  }

  promptRestore() {
    this.$dispatch('promptRestore', [this]);
  }

  get createdAt() {
    return this.created;
  }

  get rke2() {
    return false;
  }

  get nameDisplay() {
    return this.name;
  }

  get backupLocation() {
    return !!this.backupConfig.s3BackupConfig ? this.t('cluster.snapshot.rke1.s3') : this.t('cluster.snapshot.rke1.local');
  }
}
