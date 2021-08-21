import { ALLOWED_SETTINGS } from '@/config/settings';

export default {

  fromEnv() {
    return (this.source || '').toLowerCase() === 'env';
  },

  _availableActions() {
    const toFilter = ['cloneYaml', 'download', 'goToEditYaml', 'goToViewYaml', 'goToViewConfig'];
    const settingMetadata = ALLOWED_SETTINGS[this.id];

    let out = this._standardActions;

    // Some settings are not editable
    if ( settingMetadata?.readOnly || this.fromEnv ) {
      toFilter.push('goToEdit');
    }

    out = out.filter((action) => {
      return (!toFilter.includes(action.action));
    });

    // Change the label on the first action (edit)
    const editAction = out.find(action => action.action === 'goToEdit');

    if (editAction) {
      editAction.label = this.t('advancedSettings.edit.label');
    }

    return out;
  },

  customValidationRules() {
    return [
      {
        path:           'value',
        translationKey: 'setting.serverUrl.https',
        validators:     [`isHttps:${ this.metadata.name }`]
      },
    ];
  },

};
