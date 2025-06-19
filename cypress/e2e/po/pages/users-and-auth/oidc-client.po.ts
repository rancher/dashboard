import PagePo from '@/cypress/e2e/po/pages/page.po';
import OidcClientsListPo from '@/cypress/e2e/po/lists/management.cattle.io.oidcclient-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
/**
 * OIDC clients page po
 */
export default class OidcClientsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/auth/management.cattle.io.oidcclient`;
  }

  static goTo(clusterId = '_'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(OidcClientsPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(OidcClientsPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');
    sideNav.navToSideMenuGroupByLabel('Client Application');
  }

  createOidcClient() {
    return this.list().masthead().actions().eq(0)
      .click();
  }

  list(): OidcClientsListPo {
    return new OidcClientsListPo('[data-testid="oidc-clients-list"]');
  }
}
