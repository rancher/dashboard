import { insertAt } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class AuditPolicy extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:   'enable',
      label:    this.t('action.enable'),
      icon:     'icon icon-play',
      enabled:  (this.canEdit || this.canEditYaml) && !this.spec.enabled,
      bulkable: true,
      weight:   2,
    });
    insertAt(out, 0, {
      action:   'disable',
      label:    this.t('action.disable'),
      icon:     'icon icon-pause',
      enabled:  (this.canEdit || this.canEditYaml) && this.spec.enabled,
      bulkable: true,
      weight:   1,
    });

    return out;
  }

  enable() {
    this.enableOrDisable('enable');
  }

  disable() {
    this.enableOrDisable('disable');
  }

  async enableOrDisable(flag) {
    const clone = await this.$dispatch('rancher/clone', { resource: this }, { root: true });

    clone.spec.enabled = flag === 'enable';
    await clone.save().catch((err) => {
      this.$dispatch('growl/fromError', {
        title: this.t('auditPolicy.error.enableOrDisable', { flag, id: this.id }), err, timeout: 5000
      }, { root: true });
    });
  }
}
