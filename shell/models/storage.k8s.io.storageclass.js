import { STORAGE } from '@shell/config/labels-annotations';
import { STORAGE_CLASS } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';

// These are storage class drivers w/ custom components
// all but longhorn are in-tree plugins
export const PROVISIONER_OPTIONS = [
  {
    labelKey:   'storageClass.aws-ebs.title',
    value:      'kubernetes.io/aws-ebs',
    supported:  true,
    deprecated: true,
  },
  {
    labelKey:   'storageClass.azure-disk.title',
    value:      'kubernetes.io/azure-disk',
    supported:  true,
    deprecated: true
  },
  {
    labelKey:   'storageClass.azure-file.title',
    value:      'kubernetes.io/azure-file',
    supported:  true,
    deprecated: true,
  },
  {
    labelKey: 'storageClass.rbd.title',
    value:    'kubernetes.io/rbd',
  },
  {
    labelKey: 'storageClass.glusterfs.title',
    value:    'kubernetes.io/glusterfs',
  },
  {
    labelKey:   'storageClass.gce-pd.title',
    value:      'kubernetes.io/gce-pd',
    supported:  true,
    deprecated: true,
  },
  {
    labelKey: 'storageClass.no-provisioner.title',
    value:    'kubernetes.io/no-provisioner',
  },
  {
    labelKey:  'storageClass.longhorn.title',
    value:     'driver.longhorn.io',
    supported: true
  },
  {
    labelKey:   'storageClass.cinder.title',
    value:      'kubernetes.io/cinder',
    deprecated: true,
  },
  {
    labelKey: 'storageClass.portworx-volume.title',
    value:    'kubernetes.io/portworx-volume',
  },
  {
    labelKey: 'storageClass.quobyte.title',
    value:    'kubernetes.io/quobyte',
  },
  {
    labelKey: 'storageClass.scaleio.title',
    value:    'kubernetes.io/scaleio',
  },
  {
    labelKey: 'storageClass.storageos.title',
    value:    'kubernetes.io/storageos',
  },
  {
    labelKey:   'storageClass.vsphere-volume.title',
    value:      'kubernetes.io/vsphere-volume',
    supported:  true,
    deprecated: true
  },
  {
    labelKey:      'storageClass.harvesterhci.title',
    value:         'driver.harvesterhci.io',
    supported:     true,
    hideCustomize: true,
  }
];

export default class extends SteveModel {
  get provisionerListDisplay() {
    return `${ this.provisioner } (${ this.provisionerDisplay })`;
  }

  get provisionerDisplay() {
    const option = PROVISIONER_OPTIONS.find((o) => o.value === this.provisioner);
    const fallback = `${ this.provisioner } ${ this.t('persistentVolume.csi.suffix') }`;

    return option ? this.t(option.labelKey) : this.$rootGetters['i18n/withFallback'](`persistentVolume.csi.drivers.${ this.provisioner.replaceAll('.', '-') }`, null, fallback);
  }

  get isDefault() {
    return this.annotations[STORAGE.DEFAULT_STORAGE_CLASS] === 'true';
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

  async setDefault() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const allStorageClasses = this.$rootGetters[`${ inStore }/all`](STORAGE_CLASS) || [];

    for (const storageClass of allStorageClasses) {
      await storageClass.resetDefault();
    }

    allStorageClasses.forEach((storageClass) => storageClass.resetDefault());
    this.updateDefault(true);
  }

  async resetDefault() {
    if (this.isDefault) {
      await this.updateDefault(false);
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

  cleanForNew() {
    this.$dispatch(`cleanForNew`, this);

    delete this?.metadata?.annotations?.[STORAGE.DEFAULT_STORAGE_CLASS];
  }
}
