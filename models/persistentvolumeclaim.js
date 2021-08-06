import Vue from 'vue';
import { _CLONE } from '@/config/query-params';
import { NAME as VIRTUAL } from '@/config/product/virtual';
import { HCI, PVC } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import { get, clone } from '@/utils/object';
import { stateDisplay } from '@/plugins/steve/resource-instance';

export default {
  displayNameOverride() {
    if (this.$rootGetters['currentProduct'].inStore === VIRTUAL) {
      return this.$rootGetters['i18n/t'](`typeLabel.volume`, { count: 1 });
    }
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

  stateDisplay() {
    if (this.$rootGetters['currentProduct'].inStore === VIRTUAL) {
      const ownedBy = this?.metadata?.annotations?.[HCI_ANNOTATIONS.OWNED_BY];
      const status = this?.status?.phase === 'Bound' ? 'Ready' : 'NotReady';

      if (ownedBy) {
        return 'In-use';
      } else {
        return status;
      }
    }

    return stateDisplay(this.state);
  },

  detailLocation() {
    if (this.$rootGetters['currentProduct'].inStore !== VIRTUAL) {
      return this._detailLocation;
    }

    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = 'volume';

    return detailLocation;
  },

  doneOverride() {
    if (this.$rootGetters['currentProduct'].inStore !== VIRTUAL) {
      return;
    }

    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = 'volume';
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  },

  parentLocationOverride() {
    if (this.$rootGetters['currentProduct'].inStore !== VIRTUAL) {
      return;
    }

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

  warningCount() {
    return this.resourcesStatus.warningCount;
  },

  errorCount() {
    return this.resourcesStatus.errorCount;
  },

  resourcesStatus() {
    const list = this.$rootGetters['virtual/all'](PVC);

    let warning = 0;
    let error = 0;

    list.forEach((item) => {
      if (item.phaseState === 'N/A') {
        error += 1;
      } else if (item.phaseState !== 'Bound') {
        warning += 1;
      }
    });

    return {
      warningCount: warning,
      errorCount:   error
    };
  },

  volumeSort() {
    const volume = this.spec?.resources?.requests?.storage || 0;

    return parseInt(volume);
  },
};
