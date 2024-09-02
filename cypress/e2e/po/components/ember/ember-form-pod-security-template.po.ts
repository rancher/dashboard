import EmberAccordionPo from '@/cypress/e2e/po/components/ember/ember-accordion.po';
import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';

export default class EmberAddPodSecurityTemplatePo extends EmberComponentPo {
  templateName(): EmberInputPo {
    return new EmberInputPo('[data-testid="form-name-description__name"]');
  }

  templateDescription(): EmberInputPo {
    return new EmberInputPo('.ember-text-area');
  }

  addDescription() {
    this.self().find('div > a.btn', 'Add a Description').click();
  }

  accordion() {
    return new EmberAccordionPo('.accordion-wrapper');
  }

  create() {
    return this.self().find('button.btn').contains('Create').click();
  }

  save() {
    return this.self().find('button.btn').contains('Save').click();
  }
}
