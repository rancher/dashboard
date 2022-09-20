import Vue from 'vue';
import { _CLONE } from '@shell/config/query-params';
import pick from 'lodash/pick';
import { HCI, VOLUME_SNAPSHOT } from '../../types';
import {
  HCI as HCI_ANNOTATIONS,
  DESCRIPTION
} from '@shell/config/labels-annotations';
import { findBy } from '@shell/utils/array';
import { get, clone } from '@shell/utils/object';
import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import HarvesterResource from '../harvester';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';

export default class HciPv extends HarvesterResource {
  applyDefaults(_, realMode) {
    const accessModes = realMode === _CLONE ? this.spec.accessModes : [];
    const storage =
      realMode === _CLONE ? this.spec.resources.requests.storage : null;
    const storageClassName =
      realMode === _CLONE ? this.spec.storageClassName : '';

    Vue.set(this, 'spec', {
      accessModes,
      storageClassName,
      volumeName:       '',
      resources:        { requests: { storage } }
    });
  }

  get availableActions() {
    return [
      {
        action:  'exportImage',
        enabled: this.hasAction('export'),
        icon:    'icon icon-copy',
        label:   this.t('harvester.action.exportImage')
      },
      {
        action:  'cancelExpand',
        enabled: this.hasAction('cancelExpand'),
        icon:    'icon icon-backup',
        label:   this.t('harvester.action.cancelExpand')
      },
      {
        action:     'snapshot',
        enabled:    this.hasAction('snapshot'),
        icon:       'icon icon-backup',
        label:      this.t('harvester.action.snapshot'),
      },
      {
        action:     'pvcClone',
        enabled:    this.hasAction('clone'),
        icon:       'icon icon-copy',
        label:      this.t('harvester.action.pvcClone'),
      },
      ...super._availableActions
    ];
  }

  exportImage(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'HarvesterExportImageDialog'
    });
  }

  cancelExpand(resources = this) {
    this.doActionGrowl('cancelExpand', {});
  }

  snapshot(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'SnapshotDialog'
    });
  }

  pvcClone(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'PvcCloneDialog'
    });
  }

  cleanForNew() {
    this.$dispatch(`cleanForNew`, this);

    delete this.metadata.finalizers;
    const keys = [HCI_ANNOTATIONS.IMAGE_ID, DESCRIPTION];

    this.metadata.annotations = pick(this.metadata.annotations, keys);
  }

  get canUpdate() {
    return this.hasLink('update');
  }

  get stateDisplay() {
    const ownedBy = this?.metadata?.annotations?.[HCI_ANNOTATIONS.OWNED_BY];
    const status = this?.status?.phase === 'Bound' ? 'Ready' : 'NotReady';

    const conditions = this?.status?.conditions || [];

    if (findBy(conditions, 'type', 'Resizing')?.status === 'True') {
      return 'Resizing';
    } else if (ownedBy) {
      return 'In-use';
    } else {
      return status;
    }
  }

  get state() {
    let status = this?.status?.phase === 'Bound' ? 'Ready' : 'NotReady';

    const conditions = this?.status?.conditions || [];

    if (findBy(conditions, 'type', 'Resizing')?.status === 'True') {
      status = 'Resizing';
    }

    return status;
  }

  get stateColor() {
    const state = this.stateDisplay;

    return colorForState(state);
  }

  get stateDescription() {
    return (
      this.metadata?.annotations?.[HCI_ANNOTATIONS.VM_VOLUME_STATUS] ||
      super.stateDescription
    );
  }

  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.VOLUME;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.VOLUME;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource`;

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.VOLUME }"`, { count: 1 }).trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  get phaseState() {
    return this.status?.phase || 'N/A';
  }

  get attachVM() {
    const allVMs = this.$rootGetters['harvester/all'](HCI.VM);
    const ownedBy =
      get(this, `metadata.annotations."${ HCI_ANNOTATIONS.OWNED_BY }"`) || '';

    if (!ownedBy) {
      return null;
    }

    const ownedId = JSON.parse(ownedBy)[0]?.refs?.[0];

    return allVMs.find(D => D.id === ownedId);
  }

  get isAvailable() {
    return this.stateDisplay !== 'Resizing';
  }

  get volumeSort() {
    const volume = this.spec?.resources?.requests?.storage || 0;

    return parseInt(volume);
  }

  get isSystemResource() {
    const systemNamespaces = this.$rootGetters['systemNamespaces'];

    if (systemNamespaces.includes(this.metadata?.namespace)) {
      return true;
    }

    return false;
  }

  get relatedVolumeSnapshotCounts() {
    const snapshots = this.$rootGetters['harvester/all'](VOLUME_SNAPSHOT);

    return snapshots.filter((snapshot) => {
      const volumeName = snapshot.spec?.source?.persistentVolumeClaimName;
      const snapClass = snapshot.spec?.volumeSnapshotClassName;

      return volumeName === this.metadata?.name && !['longhorn', 'vxflexos-backupclass'].includes(snapClass);
    });
  }

  get originalSnapshot() {
    if (this.spec?.dataSource) {
      return this.$rootGetters['harvester/all'](VOLUME_SNAPSHOT).find(V => V.metadata?.name === this.spec.dataSource.name);
    } else {
      return null;
    }
  }

  get source() {
    const imageId = get(this, `metadata.annotations."${ HCI_ANNOTATIONS.IMAGE_ID }"`);

    return imageId ? 'image' : 'data';
  }
}
