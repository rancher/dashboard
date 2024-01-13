import ClusterManagerDetailPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

class SnapshotsListPo extends BaseResourceList {
  name(snapshotName: string) {
    return this.resourceTable().sortableTable().rowWithName(snapshotName).column(2);
  }

  selectAll() {
    return this.self().find('[data-testid="sortable-table_check_select_all"]').find('.checkbox-container').click();
  }

  delete() {
    return this.resourceTable().sortableTable().deleteButton().click();
  }
}

/**
 * Covers core functionality of the dashboard's cluster snapshots details tab
 */
export default class ClusterManagerDetailSnapshotsPo extends ClusterManagerDetailPagePo {
  goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo('', 'snapshots');
  }

  waitForPage(): Cypress.Chainable<string> {
    return super.waitForPage('', 'snapshots');
  }

  create() {
    return new AsyncButtonPo(this.self().get('[data-testid="search-box-filter-row"] > [data-testid="action-button-async-button"]')).click();
  }

  list() {
    return new SnapshotsListPo(this.self().find('[data-testid="cluster-snapshots-list"]'));
  }
}
