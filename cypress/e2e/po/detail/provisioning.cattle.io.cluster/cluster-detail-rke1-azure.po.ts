import ClusterManagerDetailPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

/**
 * Detail page for an RKE1 azure cluster
 */
export default class ClusterManagerDetailRke1AzurePagePo extends ClusterManagerDetailPagePo {
  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }
}
