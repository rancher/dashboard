import PagePo from '@/cypress/e2e/po/pages/page.po';
import CruResourcePo from '@/cypress/e2e/po/components/cru-resource.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class BaseCloudCredentialsPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/manager/cloudCredential`;

    return id ? `${ root }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', id?: string) {
    super(BaseCloudCredentialsPo.createPath(clusterId, id));
  }

  cloudServiceOptions(): CruResourcePo {
    return new CruResourcePo('[data-testid="cru-form"]');
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }

  saveButton() {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
