import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';

export default class EmberModalAddAzureNodeTemplatePo extends EmberModalPo {
  subscriptionId(): EmberInputPo {
    return new EmberInputPo('.horizontal-form #azure-subscription-id');
  }

  clientId(): EmberInputPo {
    return new EmberInputPo('.horizontal-form #azure-client-id');
  }

  clientSecret(): EmberInputPo {
    return new EmberInputPo('.horizontal-form #azure-client-secret');
  }

  nextButton(label: string) {
    return this.self().contains('.btn', label, { timeout: 10000 });
  }

  checkOption(value: string) {
    return this.self().find('.form-control').contains(value).click();
  }

  templateName(): EmberInputPo {
    return new EmberInputPo('.modal-container [data-testid="form-name-description__name"]');
  }

  region(): EmberSelectPo {
    return new EmberSelectPo('.modal-container .accordion:nth-child(1) .accordion-content select');
  }

  image(): EmberInputPo {
    return new EmberInputPo('.modal-container .accordion:nth-child(3) .accordion-content .row:nth-child(1) input');
  }

  create() {
    return this.self().find('button').contains('Create').click();
  }

  save() {
    return this.self().find('button').contains('Save').click();
  }
}
