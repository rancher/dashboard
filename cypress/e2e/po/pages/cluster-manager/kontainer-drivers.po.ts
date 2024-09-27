import PagePo from '@/cypress/e2e/po/pages/page.po';
import KontainerDriversListPo from '~/cypress/e2e/po/lists/kontainer-drivers-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
/**
 * List page for kontainerDriver resources
 */
export default class KontainerDriversPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/kontainerDriver`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KontainerDriversPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(KontainerDriversPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.navToSideMenuGroupByLabel('Drivers');
  }

  goToDriverListAndGetDriverDetails(driverName: string): Cypress.Chainable<{ id: string }> {
    let driverDetails = [];

    cy.intercept({
      method: 'GET',
      path:   '/v3/kontainerDrivers/',
    }, (req) => {
      req.continue((res) => {
        driverDetails = res.body.data;
      });
    }).as('request');

    super.goTo();

    return cy.wait('@request', { timeout: 10000 }).then(() => driverDetails.filter((c) => c.name === driverName)[0]);
  }

  title() {
    return cy.contains('.title > h1', 'Cluster Drivers');
  }

  refreshKubMetadata() {
    return cy.contains('[data-testid="kontainer-driver-refresh"]', 'Refresh Kubernetes Metadata');
  }

  createDriver() {
    return this.list().masthead().actions().eq(1)
      .click();
  }

  list(): KontainerDriversListPo {
    return new KontainerDriversListPo('[data-testid="kontainer-driver-list"]');
  }
}
