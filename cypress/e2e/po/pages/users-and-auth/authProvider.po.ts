import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export enum AuthProvider {
  AMAZON_COGNITO = 'cognito', // eslint-disable-line no-unused-vars
  AZURE = 'azuread', // eslint-disable-line no-unused-vars
  GITHUB_APP = 'githubapp', // eslint-disable-line no-unused-vars
  GENERIC_SAML = 'genericsaml', // eslint-disable-line no-unused-vars
}

export class AuthProviderPo extends PagePo {
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

  createButton() {
    return cy.getId('auth-config-create');
  }

  clickCreate() {
    return this.createButton().click();
  }

  providerSearch() {
    return cy.getId('add-auth-provider-search');
  }

  providerTile(id: string) {
    return cy.getId(`add-auth-provider-tile-${ id }`);
  }

  protocolFilter(protocol: string) {
    return cy.getId(`add-auth-provider-filter-${ protocol }`);
  }

  goToAzureADCreation(clusterId = '_'): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`/c/${ clusterId }/auth/config/azuread?mode=edit`);
  }

  goToAmazonCongitoCreation(clusterId = '_'): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`/c/${ clusterId }/auth/config/cognito?mode=edit`);
  }

  selectProvider(id: string) {
    this.clickCreate();

    return this.providerTile(id).click();
  }
}

export default AuthProviderPo;
