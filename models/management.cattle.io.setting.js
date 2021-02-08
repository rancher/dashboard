import { ALLOWED_SETTINGS } from '@/config/settings';

export default {

  _availableActions() {
    const toFilter = ['cloneYaml', 'download', 'goToEditYaml'];
    const settingMetadata = ALLOWED_SETTINGS[this.id];

    let out = this._standardActions;

    // Some settings are not editable
    if (settingMetadata && settingMetadata.readOnly) {
      toFilter.push('goToEdit');
    }

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    // Change the label on the first action (edit)
    const editAction = out.find(action => action.action === 'goToEdit');

    if (editAction) {
      editAction.label = this.t('advancedSettings.edit.label');
    }

    return out;
  }

};
