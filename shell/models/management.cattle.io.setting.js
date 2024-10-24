import { ALLOWED_SETTINGS } from '@shell/config/settings';
import HybridModel from '@shell/plugins/steve/hybrid-class';
import { isServerUrl } from '@shell/utils/validators/setting';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import {
  _EDIT,
  _UNFLAG,
  AS,
  MODE
} from '@shell/config/query-params';

export default class Setting extends HybridModel {
  get fromEnv() {
    return (this.source || '').toLowerCase() === 'env';
  }

  get _availableActions() {
    const toFilter = ['cloneYaml', 'download', 'goToEditYaml', 'goToViewYaml', 'goToViewConfig'];
    const settingMetadata = ALLOWED_SETTINGS[this.id];
    let out = super._availableActions;

    // Some settings are not editable
    if ( settingMetadata?.readOnly ) {
      toFilter.push('goToEdit');
    }

    out = out.filter((action) => {
      return (!toFilter.includes(action.action));
    });

    // Change the label on the first action (edit)
    const editAction = out.find((action) => action.action === 'goToEdit');

    if (editAction) {
      editAction.label = this.t('advancedSettings.edit.label');
    }

    return out;
  }

  get customValidationRules() {
    const out = [];

    if (isServerUrl(this.metadata.name)) {
      out.push({
        path:       'value',
        validators: ['required', 'https', 'url', 'trailingForwardSlash']
      });
    }

    return out;
  }

  goToEdit(moreQuery = {}) {
    if (this.$rootGetters['currentProduct'].inStore === HARVESTER) {
      location.name = `${ HARVESTER }-c-cluster-brand`;
      location.params = { cluster: this.$rootGetters['currentCluster'].id, product: HARVESTER };

      location.query = {
        ...location.query,
        [MODE]: _EDIT,
        [AS]:   _UNFLAG,
        ...moreQuery
      };

      this.currentRouter().push(location);
    } else {
      super.goToEdit();
    }
  }
}
