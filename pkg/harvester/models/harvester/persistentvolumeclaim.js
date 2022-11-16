import Vue from 'vue';
import { _CLONE } from '@shell/config/query-params';
import pick from 'lodash/pick';
import { HCI, VOLUME_SNAPSHOT } from '../../types';
import { PV } from '@shell/config/types';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { HCI as HCI_ANNOTATIONS } from '@/pkg/harvester/config/labels-annotations';
import { findBy } from '@shell/utils/array';
import { get, clone } from '@shell/utils/object';
import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import HarvesterResource from '../harvester';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';

const DEGRADED_ERROR = 'replica scheduling failed';

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
    const out = super._availableActions;
    const clone = out.find(action => action.action === 'goToClone');

    if (clone) {
      clone.action = 'goToCloneVolume';
    }

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
      ...out
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

  goToCloneVolume(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'VolumeCloneDialog'
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
    const volumeError = this.relatedPV?.metadata?.annotations?.[HCI_ANNOTATIONS.VOLUME_ERROR];
    const degradedVolume = volumeError === DEGRADED_ERROR;
    const status = this?.status?.phase === 'Bound' && !volumeError ? 'Ready' : 'Not Ready';

    const conditions = this?.status?.conditions || [];

    if (findBy(conditions, 'type', 'Resizing')?.status === 'True') {
      return 'Resizing';
    } else if (ownedBy && !volumeError) {
      return 'In-use';
    } else if (degradedVolume) {
      return 'Degraded';
    } else {
      return status;
    }
  }

  // state is similar with stateDisplay, the reason we keep this property is the status of In-use should not be displayed on vm detail page
  get state() {
    const volumeError = this.relatedPV?.metadata?.annotations?.[HCI_ANNOTATIONS.VOLUME_ERROR];
    const degradedVolume = volumeError === DEGRADED_ERROR;
    let status = this?.status?.phase === 'Bound' && !volumeError ? 'Ready' : 'Not Ready';

    const conditions = this?.status?.conditions || [];

    if (degradedVolume) {
      status = 'Degraded';
    }

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
      const volumeId = `${ snapshot.metadata?.namespace }/${ snapshot.spec?.source?.persistentVolumeClaimName }`;
      const kind = snapshot.metadata?.ownerReferences?.[0]?.kind;

      return volumeId === this.id && kind === 'PersistentVolumeClaim';
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

  get warnDeletionMessage() {
    return this.t('harvester.volume.promptRemove.tips');
  }

  get relatedPV() {
    return this.$rootGetters['harvester/all'](PV).find(pv => pv.metadata?.name === this.spec?.volumeName);
  }

  get customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'spec.resources.requests.storage',
        required:       true,
        validators:     ['volumeSize']
      },
    ];
  }
}
