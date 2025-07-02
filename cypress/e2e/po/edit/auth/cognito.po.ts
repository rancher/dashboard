import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class AmazonCognitoPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    return `/c/${ clusterId }/auth/config/cognito?mode=edit`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AmazonCognitoPo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(AmazonCognitoPo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');
    sideNav.navToSideMenuEntryByLabel('Auth Provider');
  }

  clientIdInputField() {
    return this.self().get('[data-testid="oidc-client-id').invoke('val');
  }

  clientSecretInputField() {
    return this.self().get('[data-testid="oidc-client-secret').invoke('val');
  }

  issuerInputField() {
    return this.self().get('[data-testid="oidc-issuer').invoke('val');
  }

  enterClientId(id: string) {
    return new LabeledInputPo('[data-testid="oidc-client-id"]').set(id);
  }

  enterClientSecret(secret: string) {
    return new LabeledInputPo('[data-testid="oidc-client-secret"]').set(secret);
  }

  enterIssuerUrl(url: string) {
    return new LabeledInputPo('[data-testid="oidc-issuer"]').set(url);
  }

  saveButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  save() {
    return new AsyncButtonPo('[data-testid="form-save"]').click();
  }

  permissionsWarningBanner() {
    return this.self().get('[data-testid="auth-provider-admin-permissions-warning-banner"]');
  }

  cognitoBanner() {
    return this.self().get('[data-testid="oidc-cognito-banner"]');
  }
}
