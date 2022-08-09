import { insertAt } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class HciNamespace extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;
    const remove = out.findIndex(a => a.action === 'promptRemove');

    const promptRemove = {
      action:     'promptRemove',
      altAction:  'remove',
      label:      this.t('action.remove'),
      icon:       'icon icon-trash',
      bulkable:   true,
      enabled:    this.canDelete,
      bulkAction: 'promptRemove',
      weight:     -10,
    };

    if (remove > -1) {
      out.splice(remove, 1);
    }

    insertAt(out, out.length - 1, promptRemove);

    return out;
  }

  promptRemove(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      warningMessageKey: 'promptRemove.confirmRelatedResource',
      component:         'harvester/ConfirmRelatedToRemoveDialog'
    });
  }
}
