import ClusterManagerDetailPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import ResourceTablePo from '~/cypress/e2e/po/components/resource-table.po';
import TooltipPo from '~/cypress/e2e/po/components/tooltip.po';

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

  groupByPoolToolTip() {
    return new TooltipPo(this.nodePoolTable().sortableTable().groupByButtons(1));
  }

  flatListToolTip() {
    return new TooltipPo(this.nodePoolTable().sortableTable().groupByButtons(0));
  }
}
