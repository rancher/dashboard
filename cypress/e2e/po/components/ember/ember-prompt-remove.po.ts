import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberPromptRemove extends EmberComponentPo {
  constructor() {
    super('.modal-container');
  }

  delete() {
    return this.self().contains('.btn', 'Delete').click();
  }
}
