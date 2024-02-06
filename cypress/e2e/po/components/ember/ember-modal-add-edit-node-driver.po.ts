import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';

export default class EmberModalNodeDriverPo extends EmberModalPo {
  formInput(index: number) {
    return new EmberInputPo(`.modal-open .inline-form:nth-of-type(${ index }) input`);
  }

  addDomainButton() {
    this.self().find('button').contains('Add Domain').click();
  }

  create() {
    return this.self().find('button').contains('Create').click();
  }

  save() {
    return this.self().find('button').contains('Save').click();
  }
}
