import { ApiPrototype } from '@shell/types/rancher-api';

import BaseClusterApi, { BaseClusterApiOptions } from './base-cluster-class';

export default class RancherApi extends BaseClusterApi {
  constructor(options: BaseClusterApiOptions) {
    super(options);
    this.context = ApiPrototype.RANCHER_API;
  }
}
