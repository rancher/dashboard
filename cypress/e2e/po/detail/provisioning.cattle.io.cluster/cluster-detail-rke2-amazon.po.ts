import ClusterManagerDetailPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

/**
 * Detail page for an RKE2 amazon EC2 cluster
 */
export default class ClusterManagerDetailRke2AmazonEc2PagePo extends ClusterManagerDetailPagePo {
  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }
}
