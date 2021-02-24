import { STORAGE } from '@/config/labels-annotations';
import { STORAGE_CLASS } from '@/config/types';

export const PROVISIONER_OPTIONS = [
  {
    labelKey: 'storageClass.aws-ebs.title',
    value:    'kubernetes.io/aws-ebs'
  },
  {
    labelKey: 'storageClass.azure-disk.title',
    value:    'kubernetes.io/azure-disk'
  },
  {
    labelKey: 'storageClass.azure-file.title',
    value:    'kubernetes.io/azure-file'
  },
  {
    labelKey: 'storageClass.gce-pd.title',
    value:    'kubernetes.io/gce-pd'
  },
  {
    labelKey: 'storageClass.longhorn.title',
    value:    'driver.longhorn.io'
  },
  {
    labelKey: 'storageClass.vsphere-volume.title',
    value:    'kubernetes.io/vsphere-volume'
  }
];

export default {
  provisionerDisplay() {
    const option = PROVISIONER_OPTIONS.find(o => o.value === this.provisioner);

    return option ? this.t(option.labelKey) : this.provisioner;
  },

  isDefault() {
    return this.annotations[STORAGE.DEFAULT_STORAGE_CLASS] === 'true';
  },

  updateDefault() {
    return (value) => {
      this.setAnnotation(STORAGE.DEFAULT_STORAGE_CLASS, value.toString());
      this.setAnnotation(STORAGE.BETA_DEFAULT_STORAGE_CLASS, value.toString());
      this.save();
    };
  },

  setDefault() {
    return () => {
      const allStorageClasses = this.$rootGetters['cluster/all'](STORAGE_CLASS) || [];

      allStorageClasses.forEach(storageClass => storageClass.resetDefault());
      this.updateDefault(true);
    };
  },

  resetDefault() {
    return () => {
      if (this.isDefault) {
        this.updateDefault(false);
      }
    };
  },

  availableActions() {
    const out = this._standardActions;

    if (this.isDefault) {
      out.unshift({
        action:     'resetDefault',
        enabled:    true,
        icon:       'icon icon-fw icon-checkmark',
        label:      this.t('storageClass.actions.resetDefault'),
      });
    } else {
      out.unshift({
        action:     'setDefault',
        enabled:    true,
        icon:       'icon icon-fw icon-checkmark',
        label:      this.t('storageClass.actions.setAsDefault'),
      });
    }

    return out;
  },
};
