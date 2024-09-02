import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';
import EmberRadioInputPo from '@/cypress/e2e/po/components/ember/ember-radio.po';
import EmberModalAddNodeTemplateGenericPo from '@/cypress/e2e/po/components/ember/ember-modal-add-node-template_generic.po';
export default class EmberModalAddNodeTemplateAwsPo extends EmberModalAddNodeTemplateGenericPo {
  accessKey(): EmberInputPo {
    return new EmberInputPo('.horizontal-form #amazonec2-accessKey');
  }

  secretKey(): EmberInputPo {
    return new EmberInputPo('.horizontal-form #amazonec2-secretKey');
  }

  defaultRegion(): EmberSelectPo {
    return new EmberSelectPo('.horizontal-form select.form-control');
  }

  selectNetwork(index: number): EmberRadioInputPo {
    return new EmberRadioInputPo(`div:nth-of-type(3) .accordion-content:nth-of-type(2) .radio:nth-of-type(${ index }) input`);
  }

  selectSecurityGroups(index: number): EmberRadioInputPo {
    return new EmberRadioInputPo(`div:nth-of-type(4) .accordion-content:nth-of-type(2) .radio:nth-of-type(${ index }) input`);
  }
}
