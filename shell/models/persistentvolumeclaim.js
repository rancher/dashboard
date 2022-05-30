
import { _CLONE } from '@shell/config/query-params';
import Vue from 'vue';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class PVC extends SteveModel {
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
}
