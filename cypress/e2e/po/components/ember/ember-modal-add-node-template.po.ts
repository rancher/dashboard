import EmberAccordionPo from '@/cypress/e2e/po/components/ember/ember-accordion.po';
import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';

export default class EmberModalAddNodeTemplatePo extends EmberModalPo {
  serviceProviderOptions(label: string) {
    return this.self().contains('.nav-box-item', new RegExp(` ${ label } `));
  }

  nextButton(label: string) {
    return this.self().contains('.btn', label, { timeout: 10000 });
  }

  accordion() {
    return new EmberAccordionPo('');
  }

  checkOption(value: string) {
    return this.self().find('.form-control').contains(value).click();
  }

  templateName(): EmberInputPo {
    return new EmberInputPo('[data-testid="form-name-description__name"]');
  }

  create() {
    return this.self().find('button').contains('Create').click();
  }

  save() {
    return this.self().find('button').contains('Save').click();
  }
}
