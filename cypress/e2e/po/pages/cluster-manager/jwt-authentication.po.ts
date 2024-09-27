import PagePo from '@/cypress/e2e/po/pages/page.po';
import JWTAuthenticationListPo from '@/cypress/e2e/po/lists/jwt-authentication-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export default class JWTAuthenticationPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/jwt.authentication`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(JWTAuthenticationPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(JWTAuthenticationPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.navToSideMenuGroupByLabel('Advanced');
    sideNav.navToSideMenuEntryByLabel('JWT Authentication');
  }

  title() {
    return cy.contains('.title > h1', 'JWT Authentication');
  }

  list(): JWTAuthenticationListPo {
    return new JWTAuthenticationListPo(this.self().find('[data-testid="jwt-authentication-list"]'));
  }
}
