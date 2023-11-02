import PagePo from '@/cypress/e2e/po/pages/page.po';
import RkeDriversListPo from '@/cypress/e2e/po/lists/rke-drivers.po';

/**
 * List page for provisioning.cattle.io.cluster resources
 */
export default class RkeDriversPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/pages/rke-drivers`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RkeDriversPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(RkeDriversPagePo.createPath(clusterId));
  }

  list(): RkeDriversListPo {
    return new RkeDriversListPo('table.grid.sortable-table');
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
