import SteveCache from '@shell/plugins/steve/caches/steve-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/cluster.x-k8s.io.machinedeployment';

export default class CapiMachineDeploymentCache extends SteveCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
