import Vue from 'vue';
import { _CLONE } from '@/config/query-params';
import { HCI } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import { get, clone } from '@/utils/object';

export default {
  displayNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel.volume`, { count: 1 });
  },

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
    const status = this?.status?.phase === 'Bound' ? 'Ready' : 'NotReady';

    if (ownedBy) {
      return 'In-use';
    } else {
      return status;
    }
  },

  detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = 'volume';

    return detailLocation;
  },

  doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = 'volume';
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  },

  parentLocationOverride() {
    return this.doneOverride;
  },

  phaseState() {
    return this.status?.phase || 'N/A';
  },

  attachVM() {
    const allVMs = this.$rootGetters['virtual/all'](HCI.VM);
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
