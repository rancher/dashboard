import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProvClusterListPo from '@/cypress/e2e/po/lists/provisioning.cattle.io.cluster.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

/**
 * List page for provisioning.cattle.io.cluster resources
 */
export default class ClusterManagerListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/provisioning.cattle.io.cluster`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerListPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(ClusterManagerListPagePo.createPath(clusterId));
  }

  static navTo() {
    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
  }

  goToClusterListAndGetClusterDetails(clusterName: string): Cypress.Chainable<{ id: string }> {
    let clusterDetails = [];

    cy.intercept({
      method: 'GET',
      path:   '/v3/clusters',
    }, (req) => {
      req.continue((res) => {
        clusterDetails = res.body.data;
      });
    }).as('request');

    super.goTo();

    return cy.wait('@request', { timeout: 10000 }).then(() => clusterDetails.find((c) => c.name === clusterName));
  }

  list(): ProvClusterListPo {
    return new ProvClusterListPo('[data-testid="cluster-list"]');
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

  editCluster(name: string) {
    this.sortableTable().rowActionMenuOpen(name).getMenuItem('Edit Config').click();
  }

  clickOnClusterName(name: string) {
    this.sortableTable().rowWithClusterName(name).click();
  }
}
