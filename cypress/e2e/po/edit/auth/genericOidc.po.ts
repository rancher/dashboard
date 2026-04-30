import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class GenericOidcPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/auth/config/genericoidc?mode=edit`;
  }

  constructor(clusterId: string) {
    super(GenericOidcPo.createPath(clusterId));
  }

  enterClientId(id: string) {
    return new LabeledInputPo('[data-testid="oidc-client-id"]').set(id);
  }

  enterClientSecret(secret: string) {
    return new LabeledInputPo('[data-testid="oidc-client-secret"]').set(secret);
  }

  selectCustomEndpoint() {
    return new RadioGroupInputPo('[data-testid="oidc-custom-endpoint"]').set(1);
  }

  enterRancherUrl(url: string) {
    return new LabeledInputPo('[data-testid="oidc-rancher-url"]').set(url);
  }

  enterIssuer(url: string) {
    return new LabeledInputPo('[data-testid="oidc-issuer"]').set(url);
  }

  enterAuthEndpoint(url: string) {
    return new LabeledInputPo('[data-testid="oidc-auth-endpoint"]').set(url);
  }

  enableCustomClaims() {
    return new CheckboxInputPo('[data-testid="input-add-custom-claims"]').set();
  }

  enterNameClaim(claim: string) {
    return new LabeledInputPo('[data-testid="input-name-claim"]').set(claim);
  }

  enterGroupsClaim(claim: string) {
    return new LabeledInputPo('[data-testid="input-groups-claim"]').set(claim);
  }

  enterEmailClaim(claim: string) {
    return new LabeledInputPo('[data-testid="input-email-claim"]').set(claim);
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
