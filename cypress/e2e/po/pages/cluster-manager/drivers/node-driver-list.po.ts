import PagePo from '@/cypress/e2e/po/pages/page.po';
import NodeDriversListPo from '@/cypress/e2e/po/lists/management.cattle.io.nodedriver.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
/**
 * List page for nodeDriver resources
 */
export default class NodeDriversListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/nodeDriver`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(NodeDriversListPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(NodeDriversListPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.toggle();
    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.navToSideMenuEntryByLabel('Drivers');
    sideNav.navToSideMenuEntryByLabel('Node Drivers');
  }

  goToDriverListAndGetDriverDetails(driverName: string): Cypress.Chainable<{ id: string }> {
    let driverDetails = [];

    cy.intercept({
      method: 'GET',
      path:   '/v1/management.cattle.io.nodedrivers/',
    }, (req) => {
      req.continue((res) => {
        driverDetails = res.body.data;
      });
    }).as('request');

    super.goTo();

    return cy.wait('@request', { timeout: 10000 }).then(() => driverDetails.filter((c) => c.name === driverName)[0]);
  }

  list(): NodeDriversListPo {
    return new NodeDriversListPo(this.self().find('[data-testid="node-driver-list"]'));
  }

  /**
   * Convenience method
   */
  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }

  createDriver() {
    return this.list().masthead().actions().eq(0)
      .click();
  }

  editDriver(description: string) {
    this.sortableTable().rowActionMenuOpen(description).getMenuItem('Edit Config').click();
  }

  deactivateDriver(description: string) {
    this.sortableTable().rowActionMenuOpen(description).getMenuItem('Deactivate').click();
  }

  listElementWithName(description:string) {
    return this.sortableTable().rowElementWithName(description);
  }
}
