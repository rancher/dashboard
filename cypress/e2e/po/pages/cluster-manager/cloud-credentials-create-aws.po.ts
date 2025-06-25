import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class CloudCredentialsCreateAWSPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/cloudCredential/create?type=aws`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CloudCredentialsCreateAWSPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(CloudCredentialsCreateAWSPagePo.createPath(clusterId));
  }

  accessKeyInput() {
    return new LabeledInputPo('[data-testid="access-key"]');
  }

  secretKeyInput() {
    return new LabeledInputPo('[data-testid="secret-key"]');
  }

  credentialNameInput() {
    return new LabeledInputPo('[data-testid="name-ns-description-name"] .labeled-input input');
  }

  errorBanner() {
    return this.self().find('[data-testid="banner-content"]');
  }

  clickCreate() {
    return this.self().find('[data-testid="form-save"]').click();
  }
}
