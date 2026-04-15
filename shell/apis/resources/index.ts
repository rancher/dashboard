import { Store } from 'vuex';
import { ClusterApi, MgmtApi, ResourcesApiProvider } from '@shell/apis/intf/resources';
import { ResourcesApiClassImpl } from './resources-api-class';

export class ResourcesApiImpl implements ResourcesApiProvider {
  private clusterApi: ClusterApi;
  private mgmtApi: MgmtApi;

  constructor(store: Store<any>) {
    this.clusterApi = new ResourcesApiClassImpl(store, 'cluster');
    this.mgmtApi = new ResourcesApiClassImpl(store, 'management');
  }

  get cluster(): ClusterApi {
    return this.clusterApi;
  }

  get mgmt(): MgmtApi {
    return this.mgmtApi;
  }
}
