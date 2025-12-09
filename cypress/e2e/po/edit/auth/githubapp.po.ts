import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class GithubAppPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    return `/c/${ clusterId }/auth/config/githubapp?mode=edit`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(GithubAppPo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(GithubAppPo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');
    sideNav.navToSideMenuEntryByLabel('Auth Provider');
  }

  clientIdInputField() {
    return this.self().get('[data-testid="client-id"').invoke('val');
  }

  enterClientId(id: string) {
    return new LabeledInputPo('[data-testid="client-id"]').set(id);
  }

  clientSecretInputField() {
    return this.self().get('[data-testid="client-secret"').invoke('val');
  }

  enterClientSecret(val: string) {
    return new LabeledInputPo('[data-testid="client-secret"]').set(val);
  }

  gitHubAppIdInputField() {
    return this.self().get('[data-testid="app-id"').invoke('val');
  }

  enterGitHubAppId(val: string) {
    return new LabeledInputPo('[data-testid="app-id"]').set(val);
  }

  installationIdInputField() {
    return this.self().get('[data-testid="installation-id"').invoke('val');
  }

  enterInstallationId(val: string) {
    return new LabeledInputPo('[data-testid="installation-id"]').set(val);
  }

  privateKeyInputField() {
    return this.self().get('[data-testid="private-key"').invoke('val');
  }

  enterPrivateKey(val: string) {
    return new LabeledInputPo('[data-testid="private-key"]').set(val);
  }

  saveButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  save() {
    return new AsyncButtonPo('[data-testid="form-save"]').click();
  }

  gitHubAppBanner() {
    return this.self().get('[data-testid="github-app-banner"]');
  }

  permissionsWarningBanner() {
    return this.self().get('[data-testid="auth-provider-admin-permissions-warning-banner"]');
  }
}
