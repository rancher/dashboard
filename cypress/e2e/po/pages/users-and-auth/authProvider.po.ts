import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class AuthProviderPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    return `/c/${ clusterId }/auth/config`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AuthProviderPo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(AuthProviderPo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');
    sideNav.navToSideMenuEntryByLabel('Auth Provider');
  }

  goToAzureADCreation(clusterId = '_'): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`/c/${ clusterId }/auth/config/azuread?mode=edit`);
  }

  selectAzureAd() {
    return this.self().find('[data-testid="select-icon-grid-AzureAD"]').click();
  }
}
