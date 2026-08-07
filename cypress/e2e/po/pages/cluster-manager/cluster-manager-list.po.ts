import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import ProvClusterListPo from '@/cypress/e2e/po/lists/provisioning.cattle.io.cluster.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { GetOptions } from '@/cypress/e2e/po/components/component.po';

/**
 * List page for provisioning.cattle.io.cluster resources
 */
export default class ClusterManagerListPagePo extends BaseListPagePo {
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
   * Waits until the cluster list is rendered.
   *
   * `ResourceList` loads the per-type list component through a dynamic import,
   * so this container does not exist until that chunk has been fetched and
   * mounted. The first navigation of a run needs a generous timeout for that.
   *
   * Waits on the list rather than on an action button, which actions render
   * depends on the user's permissions.
   */
  waitForListReady(options?: GetOptions) {
    return this.list().checkVisible(options);
  }

  /**
   * Convenience method
   */
  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }

  /**
   * Import button in the list masthead.
   *
   * Found by test id rather than by position. The button is conditional on
   * `canImport`, so an index based lookup silently resolves to the create
   * button whenever it is absent. The masthead is a sibling of `cluster-list`,
   * so this cannot be scoped to the list container.
   */
  importClusterButton(options?: GetOptions) {
    return cy.get('[data-testid="cluster-manager-list-import"]', options);
  }

  importCluster() {
    return this.importClusterButton().click();
  }

  createCluster() {
    return this.list().masthead().actions().eq(1)
      .click();
  }

  editCluster(name: string) {
    this.sortableTable().rowActionMenuOpen(name).getMenuItem('Edit Config').click();
  }

  /**
   * Returns the state-description row that follows this row
   * @returns
   */
  capiWarningSubRow(clusterName: string) {
    return this.list().self().find(`[data-testid="capi-unsupported-warning-${ clusterName }"]`);
  }
}
