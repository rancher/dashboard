import Vue from 'vue';
import { _CLONE } from '@/config/query-params';
import { HCI } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import { findBy } from '@/utils/array';
import { get, clone } from '@/utils/object';

export default {

  applyDefaults() {
    return (_, realMode) => {
      const accessModes = realMode === _CLONE ? this.spec.accessModes : [];
      const storage = realMode === _CLONE ? this.spec.resources.requests.storage : null;

      Vue.set(this, 'spec', {
        accessModes,
        storageClassName: '',
        volumeName:       '',
        resources:        { requests: { storage } }
      });
    };
  },

  canUpdate() {
    return this.hasLink('update');
  },

  stateDisplay() {
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
  },

  detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.VOLUME;

    return detailLocation;
  },

  doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.VOLUME;
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  },

  parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.VOLUME }"`, { count: 1 }).trim();
  },

  parentLocationOverride() {
    return this.doneOverride;
  },

  phaseState() {
    return this.status?.phase || 'N/A';
  },

  attachVM() {
    const allVMs = this.$rootGetters['harvester/all'](HCI.VM);
    const ownedBy = get(this, `metadata.annotations."${ HCI_ANNOTATIONS.OWNED_BY }"`) || '';

    if (!ownedBy) {
      return;
    }

    const ownedId = JSON.parse(ownedBy)[0]?.refs?.[0];

    return allVMs.find( D => D.id === ownedId);
  },

  volumeSort() {
    const volume = this.spec?.resources?.requests?.storage || 0;

    return parseInt(volume);
  },
};
