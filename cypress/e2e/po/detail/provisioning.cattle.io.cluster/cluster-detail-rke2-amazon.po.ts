import ClusterManagerDetailPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail.po';
import MachinePoolsListPo from '@/cypress/e2e/po/lists/machine-pools-list.po';

/**
 * Detail page for an RKE2 amazon EC2 cluster
 */
export default class ClusterManagerDetailRke2AmazonEc2PagePo extends ClusterManagerDetailPagePo {
  title() {
    return this.self().find('.primaryheader h1');
  }

  machinePoolsList() {
    return new MachinePoolsListPo(this.self().find('[data-testid="sortable-table-list-container"]'));
  }
}
