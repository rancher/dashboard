import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import ProvClusterListPo from '@/cypress/e2e/po/lists/provisioning.cattle.io.cluster.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

/**
 * List page for management.cattle.io.cluster resources
 */
export default class ClusterManagerListPagePo extends BaseListPagePo {
  public static supplementListRequests(provCluster: any, mgmtCluster: any) {
    cy.intercept('GET', `/v1/management.cattle.io.clusters?*`, (req) => {
      req.continue((res) => {
        res.body.data.push(mgmtCluster);
        res.send(res.body);
      });
    }).as('mgmtClusters');

    cy.intercept({
      method:   'GET',
      pathname: '/v1/provisioning.cattle.io.clusters',
    }, (req) => {
      req.continue((res) => {
        res.body.data.push(provCluster);

        res.send(res.body);
      });
    }).as('provClusters');

    cy.intercept('GET', `/v1/provisioning.cattle.io.clusters/${ provCluster.id }?*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       provCluster,
      });
    }).as('provCluster');
  }

  public static mockListRequests(provClusterList: any, mgmtClusterList: any) {
    // Covers specific get
    cy.intercept('GET', `/v1/management.cattle.io.clusters/${ mgmtClusterList.data[0].id }?*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       mgmtClusterList.data[0],
      });
    }).as('mgmtCluster');

    // Covers both side bar and any standard cluster list
    cy.intercept({
      method:   'GET',
      pathname: '/v1/management.cattle.io.clusters',
      query:    { pagesize: '*' }
    }, (req) => {
      req.reply({
        statusCode: 200,
        body:       mgmtClusterList,
      });
    }).as('mgmtClusterList');

    // Covers specific get
    cy.intercept('GET', `/v1/provisioning.cattle.io.clusters/${ provClusterList.data[0].id }?*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       provClusterList.data[0],
      });
    }).as('provCluster');

    // Covers only fetch all of prov cluster, probably un-used
    cy.intercept({
      method:   'GET',
      pathname: '/v1/provisioning.cattle.io.clusters',
    }, (req) => {
      req.reply({
        statusCode: 200,
        body:       provClusterList,
      });
    }).as('provClusterList');
  }

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

  /**
   * Returns the state-description row that follows this row
   * @returns
   */
  capiWarningSubRow(clusterName: string) {
    return this.list().self().find(`[data-testid="capi-unsupported-warning-${ clusterName }"]`);
  }
}
