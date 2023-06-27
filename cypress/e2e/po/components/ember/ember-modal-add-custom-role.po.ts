import EmberAccordionPo from '@/cypress/e2e/po/components/ember/ember-accordion.po';
import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';

export default class EmberModalAddCustomRolePo extends EmberModalPo {
  accordion() {
    return new EmberAccordionPo(`modal-add-custom-roles__accordion`);
  }

  checkOption(value: string) {
    return this.self().find('.form-control').contains(value).click();
  }

  save() {
    return this.self().find('button').contains('Save').click();
  }
}
