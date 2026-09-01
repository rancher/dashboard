import ClusterManagerDetailPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import SnapshotsListPo from '@/cypress/e2e/po/lists/snapshots-list.po';

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
