import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProvClusterListPo from '@/cypress/e2e/po/lists/provisioning.cattle.io.cluster.po';

/**
 * List page for provisioning.cattle.io.cluster resources
 */
export default class ClusterManagerListPagePo extends PagePo {
  static url: string = '/c/local/manager/provisioning.cattle.io.cluster'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerListPagePo.url);
  }

  constructor() {
    super(ClusterManagerListPagePo.url);
  }

  list(): ProvClusterListPo {
    return new ProvClusterListPo(this.self().find('[data-testid="cluster-list"]'));
  }

  /**
   * Convenience method
   */
  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }

  importCluster() {
    return this.list().masthead().actions().eq(0)
      .click();
  }

  createCluster() {
    return this.list().masthead().actions().eq(1)
      .click();
  }
}
