import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class OpenLdapPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/auth/config/openldap?mode=edit`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(OpenLdapPo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(OpenLdapPo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Users & Authentication');
    sideNav.navToSideMenuEntryByLabel('Auth Provider');
  }

  enterHostname(value: string) {
    return new LabeledInputPo('[data-testid="ldap-hostname"]').set(value);
  }

  enterServiceAccountDn(value: string) {
    return new LabeledInputPo('[data-testid="ldap-service-account-dn"]').set(value);
  }

  enterServiceAccountPassword(value: string) {
    return new LabeledInputPo('[data-testid="ldap-service-account-password"]').set(value, true);
  }

  enterUserSearchBase(value: string) {
    return new LabeledInputPo('[data-testid="ldap-user-search-base"]').set(value);
  }

  userIdAttribute(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="ldap-user-id-attribute"]');
  }

  groupIdAttribute(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="ldap-group-id-attribute"]');
  }

  enterTestUsername(value: string) {
    return new LabeledInputPo('[data-testid="ldap-test-username"]').set(value);
  }

  enterTestPassword(value: string) {
    return new LabeledInputPo('[data-testid="ldap-test-password"]').set(value, true);
  }

  saveButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  save() {
    return new AsyncButtonPo('[data-testid="form-save"]').click();
  }
}
