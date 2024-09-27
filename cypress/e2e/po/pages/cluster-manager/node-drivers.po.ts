import PagePo from '@/cypress/e2e/po/pages/page.po';
import NodeDriversListPo from '~/cypress/e2e/po/lists/node-drivers-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
/**
 * List page for nodeDriver resources
 */
export default class NodeDriversPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/nodeDriver`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(NodeDriversPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(NodeDriversPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.navToSideMenuGroupByLabel('Drivers');
    sideNav.navToSideMenuEntryByLabel('Node Drivers');
  }

  goToDriverListAndGetDriverDetails(driverName: string): Cypress.Chainable<{ id: string }> {
    let driverDetails = [];

    cy.intercept({
      method: 'GET',
      path:   '/v3/nodeDrivers/',
    }, (req) => {
      req.continue((res) => {
        driverDetails = res.body.data;
      });
    }).as('request');

    super.goTo();

    return cy.wait('@request', { timeout: 10000 }).then(() => driverDetails.filter((c) => c.name === driverName)[0]);
  }

  title() {
    return cy.contains('.title > h1', 'Node Drivers');
  }

  createDriver() {
    return this.list().masthead().actions().eq(0)
      .click();
  }

  list(): NodeDriversListPo {
    return new NodeDriversListPo(this.self().find('[data-testid="node-driver-list"]'));
  }
}
