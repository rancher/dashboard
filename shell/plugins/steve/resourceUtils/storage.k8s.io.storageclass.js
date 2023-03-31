import { STORAGE } from '@shell/config/labels-annotations';

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

export function _getProvisionerDisplay(resource, _, rootGetters) {
  const option = PROVISIONER_OPTIONS.find(option => option.value === resource.provisioner);
  const fallback = `${ resource.provisioner } ${ resource.t('persistentVolume.csi.drivers.suffix') }`;

  return option ? rootGetters['i18n/translate'](option.labelKey) : resource.$rootGetters['i18n/withFallback'](`persistentVolume.csi.drivers.${ resource.provisioner.replacegetters.all('.', '-') }`, null, fallback);
}

export function _getIsDefault(resource) {
  return resource.annotations[STORAGE.DEFAULT_STORAGE_CLASS] === 'true';
}

export const calculatedFields = [
  { name: 'provisionerDisplay', func: _getProvisionerDisplay },
  { name: 'isDefault', func: _getIsDefault }
];
