import { HCI } from '../types';
import { clone } from '@shell/utils/object';
import HarvesterResource from './harvester';

export default class HciClusterNetwork extends HarvesterResource {
  get availableActions() {
    let out = super._availableActions;
    const toFilter = ['goToClone', 'cloneYaml', 'goToViewYaml', 'goToViewConfig', 'promptRemove', 'goToEditYaml', 'download'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    const editAction = out.find(action => action.action === 'goToEdit');

    if (editAction) {
      editAction.label = this.t('advancedSettings.edit.label');
    }

    return out;
  }

  get doneOverride() {
    const detailLocation = clone(this.listLocation);

    detailLocation.params.resource = HCI.SETTING;

    return detailLocation;
  }

  get parentLocationOverride() {
    return {
      ...this.listLocation,
      params: {
        ...this.listLocation.params,
        resource: HCI.SETTING
      }
    };
  }

  // vlan
  get canUseVlan() {
    return this.isVlanOpen && this.defaultPhysicalNic.length > 0;
  }

  get canReset() {
    return true;
  }

  get defaultValue() {
    this.enable = false;
    if (this.config) { // initializing: the config value is empty
      this.config.defaultPhysicalNIC = '';
    }

    return this;
  }

  get isVlanOpen() {
    return !!this.enable;
  }

  get defaultPhysicalNic() {
    return this?.config?.defaultPhysicalNIC;
  }

  get displayValue() { // Select the field you want to display
    if (this.enable) {
      return this?.config?.defaultPhysicalNIC || '';
    }

    return '';
  }

  get customValue() {
    return this.enable ? this?.config?.defaultPhysicalNIC : null;
  }

  get hasCustomized() {
    return this.enable;
  }

  get customValidationRules() {
    const out = [];

    if (this.enable) {
      out.push({
        nullable:       false,
        path:           'config.defaultPhysicalNIC',
        required:       true,
        translationKey: 'harvester.setting.validation.physicalNIC',
        type:           'string',
      });
    }

    return out;
  }
}
