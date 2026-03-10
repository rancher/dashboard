import { Store } from 'vuex';
import { ClusterApi, MgmtApi, ResourcesApi } from '@shell/apis/intf/resources';
import { ClusterApiImpl } from './cluster';
import { MgmtApiImpl } from './mgmt';

export class ResourcesApiImpl implements ResourcesApi {
  private clusterApi: ClusterApi;
  private mgmtApi: MgmtApi;

  constructor(store: Store<any>) {
    this.clusterApi = new ClusterApiImpl(store);
    this.mgmtApi = new MgmtApiImpl(store);
  }

  get cluster(): ClusterApi {
    return this.clusterApi;
  }

  get mgmt(): MgmtApi {
    return this.mgmtApi;
  }
}
