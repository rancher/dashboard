import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberModalPo extends EmberComponentPo {
  constructor() {
    super('.modal-open');
  }

  deactivate() {
    return this.self().contains('.btn', 'Deactivate').click();
  }

  delete() {
    return this.self().contains('.btn', 'Delete').click();
  }
}
