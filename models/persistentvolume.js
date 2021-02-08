import { PVC } from '@/config/types';

export const VOLUME_PLUGINS = [
  {
    labelKey: 'persistentVolume.awsElasticBlockStore.label',
    value:    'awsElasticBlockStore',
  },
  {
    labelKey: 'persistentVolume.azureDisk.label',
    value:    'azureDisk',
  },
  {
    labelKey: 'persistentVolume.azureFile.label',
    value:    'azureFile',
  },
  {
    labelKey: 'persistentVolume.gcePersistentDisk.label',
    value:    'gcePersistentDisk',
  },
  {
    labelKey: 'persistentVolume.hostPath.label',
    value:    'hostPath',
  },
  {
    labelKey: 'persistentVolume.local.label',
    value:    'local',
  },
  {
    labelKey: 'persistentVolume.csi.label',
    value:    'csi',
  },
  {
    labelKey: 'persistentVolume.nfs.label',
    value:    'nfs',
  },
  {
    labelKey: 'persistentVolume.vsphereVolume.label',
    value:    'vsphereVolume',
  },
];

export default {
  source() {
    return this.t(VOLUME_PLUGINS.find(plugin => this.spec[plugin.value]).labelKey);
  },
  claim() {
    const allClaims = this.$rootGetters['cluster/all'](PVC);

    return allClaims.find(claim => claim.spec.volumeName === this.name);
  }
};
