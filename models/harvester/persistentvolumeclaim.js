import Vue from 'vue';
import { _CLONE } from '@/config/query-params';
import { HCI } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import { findBy } from '@/utils/array';
import { get, clone } from '@/utils/object';
import SteveModel from '@/plugins/steve/steve-class';

export default class HciPv extends SteveModel {
  applyDefaults(_, realMode) {
    const accessModes = realMode === _CLONE ? this.spec.accessModes : [];
    const storage = realMode === _CLONE ? this.spec.resources.requests.storage : null;

    Vue.set(this, 'spec', {
      accessModes,
      storageClassName: '',
      volumeName:       '',
      resources:        { requests: { storage } }
    });
  }

  get availableActions() {
    return [
      {
        action:     'exportImage',
        enabled:    this.hasAction('export'),
        icon:       'icon icon-copy',
        label:      this.t('harvester.action.exportImage'),
      },
      ...super._availableActions
    ];
  }

  exportImage(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'harvester/ExportImageDialog'
    });
  }

  get canUpdate() {
    return this.hasLink('update');
  }

  get stateDisplay() {
    const ownedBy = this?.metadata?.annotations?.[HCI_ANNOTATIONS.OWNED_BY];
    let status = this?.status?.phase === 'Bound' ? 'Ready' : 'NotReady';

    const conditions = this?.status?.conditions || [];

    if (findBy(conditions, 'type', 'Resizing')?.status === 'True') {
      status = 'Resizing';
    }

    if (ownedBy) {
      return 'In-use';
    } else {
      return status;
    }
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
    detailLocation.name = 'c-cluster-product-resource';

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
    const ownedBy = get(this, `metadata.annotations."${ HCI_ANNOTATIONS.OWNED_BY }"`) || '';

    if (!ownedBy) {
      return null;
    }

    const ownedId = JSON.parse(ownedBy)[0]?.refs?.[0];

    return allVMs.find( D => D.id === ownedId);
  }

  get volumeSort() {
    const volume = this.spec?.resources?.requests?.storage || 0;

    return parseInt(volume);
  }
}
