import PagePo from '@/cypress/e2e/po/pages/page.po';
import AppRepoListPo from '/cypress/e2e/po/lists/catalog.cattle.io.clusterrepo.po';

/**
 * List page for manager/catalog.cattle.io.clusterrepo resources
 */
export default class ReposListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/catalog.cattle.io.clusterrepo`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ReposListPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(ReposListPagePo.createPath(clusterId));
  }

  list(): AppRepoListPo {
    return new AppRepoListPo('[data-testid="app-cluster-repo-list"]');
  }

  /**
   * Convenience method
   */
  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }

  create() {
    return this.list().masthead().actions().eq(0)
      .click();
  }
}
