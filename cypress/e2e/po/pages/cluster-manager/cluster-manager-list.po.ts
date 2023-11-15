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

  constructor(clusterId: string) {
    super(ClusterManagerListPagePo.createPath(clusterId));
  }

  static navTo() {
    BurgerMenuPo.toggle();
    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
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
