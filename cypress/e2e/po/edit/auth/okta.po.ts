import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class OktaPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/auth/config/okta?mode=edit`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(OktaPo.createPath(clusterId));
  }

  // Opens the config form of an enabled provider, as the Edit action on the provider list does
  static goToEditConfig(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(`${ OktaPo.createPath(clusterId) }&editConfig=true`);
  }

  constructor(clusterId: string) {
    super(OktaPo.createPath(clusterId));
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

  showLdap(): CheckboxInputPo {
    return new CheckboxInputPo('[data-testid="saml-show-ldap"]');
  }

  enterLdapHostname(value: string) {
    return new LabeledInputPo('[data-testid="ldap-hostname"]').set(value);
  }

  enterLdapServiceAccountDn(value: string) {
    return new LabeledInputPo('[data-testid="ldap-service-account-dn"]').set(value);
  }

  enterLdapServiceAccountPassword(value: string) {
    return new LabeledInputPo('[data-testid="ldap-service-account-password"]').set(value, true);
  }

  enterLdapUserSearchBase(value: string) {
    return new LabeledInputPo('[data-testid="ldap-user-search-base"]').set(value);
  }

  userIdAttribute(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="ldap-user-id-attribute"]');
  }

  groupIdAttribute(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="ldap-group-id-attribute"]');
  }

  saveButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  save() {
    return new AsyncButtonPo('[data-testid="form-save"]').click();
  }
}
