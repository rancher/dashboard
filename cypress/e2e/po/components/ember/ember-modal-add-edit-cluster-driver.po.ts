import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';

export default class EmberModalClusterDriverPo extends EmberModalPo {
  input() {
    return new EmberInputPo(`.form-control.ember-text-field`);
  }

  addDomain() {
    return this.self().find('button').contains('Add Domain').click();
  }

  create() {
    return this.self().find('button').contains('Create').click();
  }

  save() {
    return this.self().find('button').contains('Save').click();
  }

  deactivate() {
    return this.self().find('button').contains('Deactivate').click();
  }

  delete() {
    return this.self().find('button').contains('Delete').click();
  }
}
