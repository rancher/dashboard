import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberPromptDeactivate extends EmberComponentPo {
  constructor() {
    super('.modal-container');
  }

  deactivate() {
    return this.self().contains('.btn', 'Deactivate').click();
  }
}
