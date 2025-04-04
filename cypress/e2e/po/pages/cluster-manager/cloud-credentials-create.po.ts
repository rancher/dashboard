import PagePo from '@/cypress/e2e/po/pages/page.po';
import CloudCredentialsCreateAWSPagePo from '@/cypress/e2e/po/pages/cluster-manager/cloud-credentials-create-aws.po';

export default class CloudCredentialsCreatePagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/cloudCredential/create`;
  }

  static goTo(clusterId = '_'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CloudCredentialsCreatePagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(CloudCredentialsCreatePagePo.createPath(clusterId));
  }

  selectAws(): CloudCredentialsCreateAWSPagePo {
    this.self().find('[data-testid="subtype-banner-item-aws"]').click();

    return new CloudCredentialsCreateAWSPagePo();
  }
}
