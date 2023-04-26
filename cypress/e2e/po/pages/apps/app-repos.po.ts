import PagePo from '@/cypress/e2e/po/pages/page.po';
import AppRepoListPo from '~/cypress/e2e/po/lists/catalog.cattle.io.clusterrepo.po';

/**
 * List page for provisioning.cattle.io.cluster resources
 */
export default class AppReposListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/apps/catalog.cattle.io.clusterrepo`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AppReposListPagePo.createPath(clusterId));
  }

  constructor(private clusterId: string) {
    super(AppReposListPagePo.createPath(clusterId));
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
