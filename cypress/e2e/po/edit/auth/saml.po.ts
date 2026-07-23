import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class GenericSamlPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/auth/config/genericsaml?mode=edit`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(GenericSamlPo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(GenericSamlPo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');
    sideNav.navToSideMenuEntryByLabel('Auth Provider');
  }

  enterDisplayName(value: string) {
    return new LabeledInputPo('[data-testid="saml-display-name-field"]').set(value);
  }

  enterUserName(value: string) {
    return new LabeledInputPo('[data-testid="saml-user-name-field"]').set(value);
  }

  enterUid(value: string) {
    return new LabeledInputPo('[data-testid="saml-uid-field"]').set(value);
  }

  enterGroups(value: string) {
    return new LabeledInputPo('[data-testid="saml-groups-field"]').set(value);
  }

  enterRancherApiHost(value: string) {
    return new LabeledInputPo('[data-testid="saml-rancher-api-host"]').set(value);
  }

  enterKey(value: string) {
    return new LabeledInputPo('[data-testid="saml-key"]').set(value);
  }

  enterCert(value: string) {
    return new LabeledInputPo('[data-testid="saml-cert"]').set(value);
  }

  enterMetadata(value: string) {
    return new LabeledInputPo('[data-testid="saml-metadata"]').set(value);
  }

  nameIdFormat(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="saml-nameid-format"]');
  }

  signatureAlgorithm(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="saml-signature-algorithm"]');
  }

  allowIdpInitiated(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="saml-allow-idp-initiated"]');
  }

  forceAuthn(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="saml-force-authn"]');
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
}
