import PagePo from '@/cypress/e2e/po/pages/page.po';
import CloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials.po';
import CloudCredentialsListPo from '@/cypress/e2e/po/lists/cloud-credentials-list.po';

export default class CloudCredentialsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/cloudCredential`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CloudCredentialsPagePo.createPath(clusterId));
  }

  constructor(private clusterId = 'local') {
    super(CloudCredentialsPagePo.createPath(clusterId));
  }

  create() {
    return this.self().find('[data-testid="masthead-create"]').click();
  }

  createEditCloudCreds(id?: string): CloudCredentialsCreateEditPo {
    return new CloudCredentialsCreateEditPo(this.clusterId, id);
  }

  list(): CloudCredentialsListPo {
    return new CloudCredentialsListPo('[data-testid="cluster-list-container"]');
  }
}
