import {
  PVC, LONGHORN_DRIVER, SECRET, STORAGE_CLASS, VOLUME_ATTRIBUTES_CLASS, CSI_DRIVER
} from '@shell/config/types';
import { VOLUME_PLUGINS } from '@shell/config/persistentVolume';
import SteveModel from '@shell/plugins/steve/steve-class';
import { findIfExists, relatedEntry } from '@shell/utils/editable-related-resources';

// see https://kubernetes.io/docs/concepts/storage/volumes/#csi
// `controllerExpandSecretRef` is in the api reference rather than that page
const CSI_SECRET_REFS = [
  'controllerPublishSecretRef',
  'controllerExpandSecretRef',
  'nodeExpandSecretRef',
  'nodePublishSecretRef',
  'nodeStageSecretRef',
];

export default class PV extends SteveModel {
  // plugin display value table
  get source() {
    const csiDriver = this.spec?.csi?.driver;
    const fallback = `${ csiDriver } ${ this.t('persistentVolume.csi.suffix') }`;

    if (csiDriver) {
      return this.$rootGetters['i18n/withFallback'](`persistentVolume.csi.drivers.${ csiDriver.replaceAll('.', '-') }`, null, fallback);
    }
    const pluginDef = VOLUME_PLUGINS.find((plugin) => this.spec[plugin.value]);

    if (pluginDef) {
      return this.t(pluginDef.labelKey);
    }

    // every source should be a csi driver or listed in VOLUME_PLUGIN but just in case..
    return this.t('generic.unknown');
  }

  get isLonghorn() {
    return this.spec.csi && this.spec.csi.driver === LONGHORN_DRIVER;
  }

  get claim() {
    if (!this.name) {
      return null;
    }

    return this.$getters['all'](PVC).find((claim) => claim.spec.volumeName === this.name);
  }

  get claimName() {
    return this.claim?.nameDisplay || this.t('generic.na');
  }

  get canDelete() {
    return this.state !== 'bound';
  }

  /**
   * The resources related to this volume, to edit by YAML alongside it
   *
   * Dependencies: its StorageClass and VolumeAttributesClass, the Secrets its CSI driver is given,
   * and the CSIDriver object of that driver where the driver has one
   *
   * Dependents: the claim bound to it, named by `spec.claimRef`
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependencies = true, dependents = true } = {}) {
    if (!this.metadata?.uid) {
      return [];
    }

    const csi = this.spec?.csi;
    const claimRef = this.spec?.claimRef;
    const secretIds = [...new Set(CSI_SECRET_REFS
      .map((field) => csi?.[field])
      .filter((ref) => ref?.name && ref?.namespace)
      .map((ref) => `${ ref.namespace }/${ ref.name }`)
    )];
    const claimId = claimRef?.name && claimRef?.namespace && (claimRef.kind ?? 'PersistentVolumeClaim') === 'PersistentVolumeClaim' ? `${ claimRef.namespace }/${ claimRef.name }` : undefined;

    const [storageClass, attributesClass, secrets, driver, claim] = await Promise.all([
      dependencies ? findIfExists(this, STORAGE_CLASS, this.spec?.storageClassName) : null,
      dependencies ? findIfExists(this, VOLUME_ATTRIBUTES_CLASS, this.spec?.volumeAttributesClassName) : null,
      dependencies ? Promise.all(secretIds.map((id) => findIfExists(this, SECRET, id))) : [],
      dependencies ? findIfExists(this, CSI_DRIVER, csi?.driver) : null,
      dependents ? findIfExists(this, PVC, claimId) : null,
    ]);

    const sharedBanner = (resource) => () => ({ color: 'warning', label: this.t('resourceYaml.resourceGraph.banners.sharedByClaims', { type: resource.typeDisplay }) });

    return [
      ...[storageClass, attributesClass].filter(Boolean).map((resource) => relatedEntry(resource, { banner: sharedBanner(resource) })),
      ...secrets.filter(Boolean).map((resource) => relatedEntry(resource)),
      ...(driver ? [relatedEntry(driver)] : []),
      ...(claim ? [relatedEntry(claim, { dependent: true })] : []),
    ];
  }
}
