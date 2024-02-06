import PagePo from '@/cypress/e2e/po/pages/page.po';
import CruResourcePo from '@/cypress/e2e/po/components/cru-resource.po';

export default class BaseCloudCredentialsPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/manager/cloudCredential`;

    return id ? `${ root }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', id?: string) {
    super(BaseCloudCredentialsPo.createPath(clusterId, id));
  }

  cloudServiceOptions(): CruResourcePo {
    return new CruResourcePo('[data-testid="cru-form"]');
  }
}
