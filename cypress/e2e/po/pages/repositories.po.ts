import PagePo from '@/cypress/e2e/po/pages/page.po';
import RepoListPo from '@/cypress/e2e/po/lists/catalog.cattle.io.clusterrepo.po';

/**
 * List page for catalog.cattle.io.clusterrepo resources
 */
export default class ReposListPagePo extends PagePo {
  private static createPath(clusterId: string, product: 'apps' | 'manager') {
    return `/c/${ clusterId }/${ product }/catalog.cattle.io.clusterrepo`;
  }

  static goTo(clusterId: string, product: 'apps' | 'manager'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ReposListPagePo.createPath(clusterId, product));
  }

  constructor(clusterId: string, product: 'apps' | 'manager') {
    super(ReposListPagePo.createPath(clusterId, product));
  }

  list(): RepoListPo {
    return new RepoListPo('[data-testid="app-cluster-repo-list"]');
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

  waitForGoTo(endpoint: string) {
    const interceptName = `validateGoTo${ Date.now() }`;

    cy.intercept('GET', endpoint).as(interceptName);
    this.goTo();
    cy.wait(`@${ interceptName }`, { timeout: 15000 }).its('response.statusCode').should('eq', 200);
  }
}
