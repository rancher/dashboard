import { HCI } from '@/config/types';
import { clone } from '@/utils/object';

export default {
  availableActions() {
    let out = this._standardActions;
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
  },

  doneOverride() {
    const detailLocation = clone(this.listLocation);

    detailLocation.params.resource = HCI.SETTING;

    return detailLocation;
  },

  // vlan
  canUseVlan() {
    return this.isVlanOpen && this.defaultPhysicalNic.length > 0;
  },

  canReset() {
    return true;
  },

  defaultValue() {
    this.enable = false;
    if (this.config) { // initializing: the config value is empty
      this.config.defaultPhysicalNIC = '';
    }

    return this;
  },

  isVlanOpen() {
    return !!this.enable;
  },

  defaultPhysicalNic() {
    return this?.config?.defaultPhysicalNIC;
  },

  displayValue() { // Select the field you want to display
    if (this.enable) {
      return this?.config?.defaultPhysicalNIC || '';
    }
  },

  customValue() {
    return this.enable ? this?.config?.defaultPhysicalNIC : null;
  },

  hasCustomized() {
    return this.enable;
  },

  customValidationRules() {
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
  },

};
