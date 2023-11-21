import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CruResourcePo from '@/cypress/e2e/po/components/cru-resource.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class CloudCredentialsCreateEditPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/manager/cloudCredential`;

    return id ? `${ root }/${ id }?mode=edit` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', id?: string) {
    super(CloudCredentialsCreateEditPo.createPath(clusterId, id));
  }

  cloudServiceOptions(): CruResourcePo {
    return new CruResourcePo('[data-testid="cru-form"]');
  }

  name(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Name');
  }

  description(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Description');
  }

  accessKey(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Access Key');
  }

  secretKey(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Secret Key');
  }

  defaultRegion(): LabeledSelectPo {
    return new LabeledSelectPo('.vs__dropdown-toggle');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }

  saveAndWaitForRequests(method: string, url: string) {
    cy.intercept(method, url).as('request');
    this.saveCreateForm().click();

    return cy.wait('@request', { timeout: 10000 });
  }
}
