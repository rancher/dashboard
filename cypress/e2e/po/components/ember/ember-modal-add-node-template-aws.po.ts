import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';
import EmberRadioInputPo from '@/cypress/e2e/po/components/ember/ember-radio.po';

export default class EmberModalAddNodeTemplatePo extends EmberModalPo {
  serviceProviderOptions(label: string) {
    return this.self().contains('.nav-box-item', new RegExp(` ${ label } `));
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

  create() {
    return this.self().find('button').contains('Create').click();
  }

  save() {
    return this.self().find('button').contains('Save').click();
  }
}
