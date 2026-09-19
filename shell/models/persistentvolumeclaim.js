
import { insertAt } from '@shell/utils/array';
import {
  AS,
  _CLONE,
  FOCUS,
  MODE,
  _UNFLAG,
  _EDIT
} from '@shell/config/query-params';
import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { POD, PV, STORAGE_CLASS } from '@shell/config/types';
import { FilterArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';

export default class PVC extends SteveModel {
  applyDefaults(_, realMode) {
    const accessModes = realMode === _CLONE ? this.spec.accessModes : [];
    const storage = realMode === _CLONE ? this.spec.resources.requests.storage : null;

    this['spec'] = {
      accessModes,
      storageClassName: '',
      volumeName:       '',
      resources:        { requests: { storage } }
    };
  }

  get bound() {
    return this.state === STATES_ENUM.BOUND;
  }

  get expandable() {
    return !!this.$getters[`byId`](STORAGE_CLASS, this.spec?.storageClassName)?.allowVolumeExpansion;
  }

  get _availableActions() {
    const out = super._availableActions;

    // Add backwards, each one to the top
    insertAt(out, 0, { divider: true });
    insertAt(out, 0, {
      action:  'goToEditVolumeSize',
      enabled: this.expandable && this.bound,
      icon:    'icon icon-plus',
      label:   this.t('persistentVolumeClaim.expand.label'),
    });

    return out;
  }

  goToEditVolumeSize() {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]:  _EDIT,
      [AS]:    _UNFLAG,
      [FOCUS]: 'volumeclaim'
    };

    this.currentRouter().push(location);
  }

  get fullDetailPageOverride() {
    return true;
  }

  get details() {
    const out = [
      {
        label:   this.t('persistentVolumeClaim.capacity'),
        content: this.spec?.resources?.requests?.storage,
      },
      {
        label:   this.t('persistentVolumeClaim.storageClass'),
        content: this.spec?.storageClassName,
      },
      {
        label:   this.t('persistentVolumeClaim.accessModes'),
        content: (this.spec?.accessModes || []).join(', '),
      },
    ];

    if (this.spec?.volumeName) {
      out.push({
        label:         this.t('persistentVolumeClaim.volumeName'),
        formatter:     'LinkName',
        formatterOpts: { type: PV, value: this.spec.volumeName },
        content:       this.spec.volumeName,
      });
    }

    return out;
  }

  /**
   * Fetch the Pods that mount this claim.
   *
   * The claim reference lives inside each Pod's spec.volumes and is not an indexed field, so it
   * cannot be filtered server-side. The Pod request is scoped to this claim's namespace (server-side
   * when SSP is available) and the volumes are matched client-side.
   */
  async fetchMountedPods() {
    if (!this.$getters['schemaFor'](POD)) {
      return [];
    }

    const namespace = this.metadata.namespace;
    const name = this.metadata.name;
    let pods;

    if (this.$getters['paginationEnabled']?.(POD)) {
      const opt = {
        pagination: new FilterArgs({ filters: [PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: namespace })] }),
        transient:  true,
      };

      const { data = [] } = await this.$dispatch('findPage', { type: POD, opt });

      pods = data;
    } else {
      pods = await this.$dispatch('findAll', { type: POD, opt: { namespaced: namespace } });
    }

    return (pods || []).filter((pod) => (pod.spec?.volumes || []).some((volume) => volume?.persistentVolumeClaim?.claimName === name));
  }
}
