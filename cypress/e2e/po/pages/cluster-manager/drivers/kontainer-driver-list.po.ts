import PagePo from '@/cypress/e2e/po/pages/page.po';
import KontainerDriversListPo from '@/cypress/e2e/po/lists/management.cattle.io.kontainerdriver.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
/**
 * List page for kontainerDriver resources
 */
export default class KontainerDriversListPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/kontainerDriver`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KontainerDriversListPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(KontainerDriversListPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.toggle();
    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.navToSideMenuEntryByLabel('Drivers');
  }

  goToDriverListAndGetDriverDetails(driverName: string): Cypress.Chainable<{ id: string }> {
    let driverDetails = [];

    cy.intercept({
      method: 'GET',
      path:   '/v1/management.cattle.io.kontainerdrivers/',
    }, (req) => {
      req.continue((res) => {
        driverDetails = res.body.data;
      });
    }).as('request');

    super.goTo();

    return cy.wait('@request', { timeout: 10000 }).then(() => driverDetails.filter((c) => c.name === driverName)[0]);
  }

  list(): KontainerDriversListPo {
    return new KontainerDriversListPo(this.self().find('[data-testid="kontainer-driver-list"]'));
  }

  /**
   * Convenience method
   */
  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }

  createDriver() {
    return this.list().masthead().actions().eq(1)
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
