import ClusterManagerDetailPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import ResourceTablePo from '~/cypress/e2e/po/components/resource-table.po';

/**
 * Detail page for built-in hosted clusters (AKS, EKS, GKE)
 */
export default class ClusterManagerDetailHostedPagePo extends ClusterManagerDetailPagePo {
  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  nodePoolTable() {
    return new ResourceTablePo(this.self().find('[data-testid="mgmt-node-table"]'));
  }
}
