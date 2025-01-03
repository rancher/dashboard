import PagePo from '@/cypress/e2e/po/pages/page.po';
import ChartRepositoriesListPo from '@/cypress/e2e/po/lists/chart-repositories.po';
import ChartRepositoriesCreateEditPo from '@/cypress/e2e/po/edit/chart-repositories.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

/**
 * List page for catalog.cattle.io.clusterrepo resources
 */
export default class ChartRepositoriesPagePo extends PagePo {
  private static createPath(clusterId: string, product: 'apps' | 'manager') {
    return `/c/${ clusterId }/${ product }/catalog.cattle.io.clusterrepo`;
  }

  static goTo(clusterId: string, product: 'apps' | 'manager'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ChartRepositoriesPagePo.createPath(clusterId, product));
  }

  constructor(private clusterId = '_', private product: 'apps' | 'manager') {
    super(ChartRepositoriesPagePo.createPath(clusterId, product));
  }

  static navTo(clusterId = '_', product: 'apps' | 'manager' = 'manager') {
    const sideNav = new ProductNavPo();

    if (product === 'apps') {
      const burgerMenu = new BurgerMenuPo();
      const sideNav = new ProductNavPo();

      burgerMenu.goToCluster(clusterId);
      sideNav.navToSideMenuGroupByLabel('Apps');
      sideNav.navToSideMenuEntryByLabel('Repositories');
    } else {
      BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
      (new ClusterManagerListPagePo()).waitForPage();

      sideNav.groups().contains('Advanced').click();
      sideNav.navToSideMenuEntryByLabel('Repositories');
    }
  }

  createEditRepositories(repoName? : string): ChartRepositoriesCreateEditPo {
    return new ChartRepositoriesCreateEditPo(this.clusterId, this.product, repoName);
  }

  list(): ChartRepositoriesListPo {
    return new ChartRepositoriesListPo('[data-testid="app-cluster-repo-list"]');
  }

  /**
   * Convenience method
   */
  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }

  create() {
    return this.list().masthead().actions().contains('Create')
      .click();
  }

  waitForGoTo(endpoint: string) {
    const interceptName = `validateGoTo${ Date.now() }`;

    cy.intercept('GET', endpoint).as(interceptName);
    this.goTo();
    cy.wait(`@${ interceptName }`, { timeout: 15000 }).its('response.statusCode').should('eq', 200);
  }
}
