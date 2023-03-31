import { PVC } from '@shell/config/types';

export const VOLUME_PLUGINS = [
  {
    labelKey:  'persistentVolume.awsElasticBlockStore.label',
    value:     'awsElasticBlockStore',
    supported: true
  },
  {
    labelKey:  'persistentVolume.azureDisk.label',
    value:     'azureDisk',
    supported: true
  },
  {
    labelKey:  'persistentVolume.azureFile.label',
    value:     'azureFile',
    supported: true
  },
  {
    labelKey: 'persistentVolume.cephfs.label',
    value:    'cephfs',
  },
  {
    labelKey: 'persistentVolume.rbd.label',
    value:    'rbd',
  },
  {
    labelKey: 'persistentVolume.csi.label',
    value:    'csi',
  },
  {
    labelKey: 'persistentVolume.fc.label',
    value:    'fc',
  },
  {
    labelKey: 'persistentVolume.flexVolume.label',
    value:    'flexVolume',
  },
  {
    labelKey: 'persistentVolume.flocker.label',
    value:    'flocker',
  },
  {
    labelKey: 'persistentVolume.glusterfs.label',
    value:    'glusterfs',
  },
  {
    labelKey:  'persistentVolume.gcePersistentDisk.label',
    value:     'gcePersistentDisk',
    supported: true
  },
  {
    labelKey:  'persistentVolume.hostPath.label',
    value:     'hostPath',
    supported: true
  },
  {
    labelKey: 'persistentVolume.iscsi.label',
    value:    'iscsi',
  },
  {
    labelKey:  'persistentVolume.local.label',
    value:     'local',
    supported: true
  },
  {
    labelKey:  'persistentVolume.longhorn.label',
    value:     'longhorn',
    supported: true
  },
  {
    labelKey:  'persistentVolume.nfs.label',
    value:     'nfs',
    supported: true
  },
  {
    labelKey: 'persistentVolume.cinder.label',
    value:    'cinder',
  },
  {
    labelKey: 'persistentVolume.photonPersistentDisk.label',
    value:    'photonPersistentDisk',
  },
  {
    labelKey: 'persistentVolume.portworxVolume.label',
    value:    'portworxVolume',
  },

  {
    labelKey: 'persistentVolume.quobyte.label',
    value:    'quobyte',
  },

  {
    labelKey: 'persistentVolume.scaleIO.label',
    value:    'scaleIO',
  },
  {
    labelKey: 'persistentVolume.storageos.label',
    value:    'storageos',
  },
  {
    labelKey:  'persistentVolume.vsphereVolume.label',
    value:     'vsphereVolume',
    supported: true
  },
];

export function _getClaim(resource, getters, rootGetters) {
  if (!resource.name) {
    return null;
  }

  const allClaims = getters.all(PVC);

  return allClaims.find(claim => claim.spec.volumeName === resource.name);
}

export function _getClaimName(resource, _, rootGetters) {
  return resource.claim?.nameDisplay || rootGetters['i18n/translate']('generic.na');
}

export function _getSource(resource, _, rootGetters) {
  const csiDriver = resource.spec?.csi?.driver;
  const fallback = `${ csiDriver } ${ rootGetters['i18n/translate']('persistentVolume.csi.drivers.suffix') }`;

  if (csiDriver) {
    return rootGetters['i18n/translateWithFallback'](`persistentVolume.csi.drivers.${ csiDriver.replacegetters.all('.', '-') }`, null, fallback);
  }
  const pluginDef = VOLUME_PLUGINS.find(plugin => resource.spec[plugin.value]);

  if (pluginDef) {
    return rootGetters['i18n/translate'](pluginDef.labelKey);
  }

  // every source should be a csi driver or listed in VOLUME_PLUGIN but just in case..
  return rootGetters['i18n/translate']('generic.unknown');
}

export const calculatedFields = [
  { name: 'claim', func: _getClaim },
  { name: 'claimName', func: _getClaimName },
  { name: 'source', func: _getSource },
];
