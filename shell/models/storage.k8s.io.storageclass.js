import { STORAGE } from '@shell/config/labels-annotations';
import { STORAGE_CLASS } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { _getIsDefault, _getProvisionerDisplay } from '@shell/plugins/steve/resourceUtils/storage.k8s.io.storageclass';

// These are storage class drivers w/ custom components
// all but longhorn are in-tree plugins

export default class extends SteveModel {
  get provisionerDisplay() {
    return _getProvisionerDisplay(this, this.$getters, this.$rootGetters);
  }

  get isDefault() {
    return _getIsDefault(this);
  }

  updateDefault(value) {
    // Update model so that the list reflects the change straight away
    this.setAnnotation(STORAGE.DEFAULT_STORAGE_CLASS, value.toString());
    this.setAnnotation(STORAGE.BETA_DEFAULT_STORAGE_CLASS, value.toString());

    // Patch the annotations rather than saving the whole object, as ssome storage classes
    // won't allow the complete object to be saved again
    const data = {
      metadata: {
        annotations: {
          [STORAGE.DEFAULT_STORAGE_CLASS]:      value.toString(),
          [STORAGE.BETA_DEFAULT_STORAGE_CLASS]: value.toString()
        }
      }
    };

    return this.patch(data, {}, true, true);
  }

  setDefault() {
    const allStorageClasses = this.$rootGetters['cluster/all'](STORAGE_CLASS) || [];

    allStorageClasses.forEach(storageClass => storageClass.resetDefault());
    this.updateDefault(true);
  }

  resetDefault() {
    if (this.isDefault) {
      this.updateDefault(false);
    }
  }

  get _availableActions() {
    const out = super._availableActions;

    if (this.isDefault) {
      out.unshift({
        action:  'resetDefault',
        enabled: true,
        icon:    'icon icon-fw icon-checkmark',
        label:   this.t('storageClass.actions.resetDefault'),
      });
    } else {
      out.unshift({
        action:  'setDefault',
        enabled: true,
        icon:    'icon icon-fw icon-checkmark',
        label:   this.t('storageClass.actions.setAsDefault'),
      });
    }

    return out;
  }
}
