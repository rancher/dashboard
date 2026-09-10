import { PVC, LONGHORN_DRIVER } from '@shell/config/types';
import { VOLUME_PLUGINS } from '@shell/config/persistentVolume';
import SteveModel from '@shell/plugins/steve/steve-class';
import { FilterArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';

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

  get details() {
    const out = [
      {
        label:   this.t('persistentVolume.detail.source'),
        content: this.source,
      },
      {
        label:   this.t('persistentVolume.capacity.label'),
        content: this.spec?.capacity?.storage,
      },
      {
        label:   this.t('persistentVolume.detail.reclaimPolicy'),
        content: this.spec?.persistentVolumeReclaimPolicy,
      },
      {
        label:   this.t('persistentVolume.detail.storageClass'),
        content: this.spec?.storageClassName,
      },
      {
        label:   this.t('persistentVolume.customize.accessModes.label'),
        content: (this.spec?.accessModes || []).join(', '),
      },
    ];

    return out;
  }

  /**
   * Fetch the PersistentVolumeClaim bound to this volume.
   *
   * The claim's name and namespace are known from spec.claimRef, so this filters server-side by
   * name (SSP) when available, falling back to a direct lookup otherwise.
   */
  async fetchPersistentVolumeClaim() {
    const claimRef = this.spec?.claimRef;

    if (!claimRef?.name || !this.$getters['schemaFor'](PVC)) {
      return null;
    }

    const { name, namespace } = claimRef;

    if (this.$getters['paginationEnabled']?.(PVC)) {
      const opt = {
        pagination: new FilterArgs({
          filters: [
            PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: namespace }),
            PaginationParamFilter.createSingleField({ field: 'metadata.name', value: name }),
          ],
        }),
        transient: true,
      };

      const { data = [] } = await this.$dispatch('findPage', { type: PVC, opt });

      return data[0] || null;
    }

    return this.$dispatch('find', { type: PVC, id: `${ namespace }/${ name }` }).catch(() => null);
  }
}
