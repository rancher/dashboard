import { Store } from 'vuex';
import { ClusterApi, MgmtApi, ResourcesApiProvider } from '@shell/apis/intf/resources';
import { ResourcesApiClassImpl } from './resources-api-class';
import { STORE } from '@shell/store/store-types.js';

export class ResourcesApiImpl implements ResourcesApiProvider {
  private clusterApi: ClusterApi;
  private mgmtApi: MgmtApi;

  constructor(store: Store<any>) {
    this.clusterApi = new ResourcesApiClassImpl(store, STORE.CLUSTER);
    this.mgmtApi = new ResourcesApiClassImpl(store, STORE.MANAGEMENT);
  }

  get cluster(): ClusterApi {
    return this.clusterApi;
  }

  get mgmt(): MgmtApi {
    return this.mgmtApi;
  }
}
