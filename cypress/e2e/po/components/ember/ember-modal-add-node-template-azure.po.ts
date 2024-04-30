import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';
import EmberModalAddNodeTemplateGenericPo from '@/cypress/e2e/po/components/ember/ember-modal-add-node-template_generic.po';

export default class EmberModalAddNodeTemplateAzurePo extends EmberModalAddNodeTemplateGenericPo {
  subscriptionId(): EmberInputPo {
    return new EmberInputPo('.horizontal-form #azure-subscription-id');
  }

  clientId(): EmberInputPo {
    return new EmberInputPo('.horizontal-form #azure-client-id');
  }

  clientSecret(): EmberInputPo {
    return new EmberInputPo('.horizontal-form #azure-client-secret');
  }

  region(): EmberSelectPo {
    return new EmberSelectPo('.modal-container .accordion:nth-child(1) .accordion-content select');
  }

  image(): EmberInputPo {
    return new EmberInputPo('.modal-container .accordion:nth-child(3) .accordion-content .row:nth-child(1) input');
  }
}
