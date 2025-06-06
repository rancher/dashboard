import PagePo from '@/cypress/e2e/po/pages/page.po';
import OidcClientsListPo from '~/cypress/e2e/po/lists/oidc-clients-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
/**
 * OIDC clients page po
 */
export default class OidcClientsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/auth/management.cattle.io.oidcclient`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(OidcClientsPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(OidcClientsPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');
    sideNav.navToSideMenuGroupByLabel('Client Application');
  }

  // goToDriverListAndGetDriverDetails(driverName: string): Cypress.Chainable<{ id: string }> {
  //   let driverDetails = [];

  //   cy.intercept({
  //     method: 'GET',
  //     path:   '/v3/kontainerDrivers/',
  //   }, (req) => {
  //     req.continue((res) => {
  //       driverDetails = res.body.data;
  //     });
  //   }).as('request');

  //   super.goTo();

  //   return cy.wait('@request', { timeout: 10000 }).then(() => driverDetails.filter((c) => c.name === driverName)[0]);
  // }

  title() {
    return cy.contains('.title > h1', 'Client Applications');
  }

  // refreshKubMetadata() {
  //   return cy.contains('[data-testid="kontainer-driver-refresh"]', 'Refresh Kubernetes Metadata');
  // }

  createOidcClient() {
    return this.list().masthead().actions().eq(0)
      .click();
  }

  list(): OidcClientsListPo {
    return new OidcClientsListPo('[data-testid="oidc-clients-list"]');
  }
}
