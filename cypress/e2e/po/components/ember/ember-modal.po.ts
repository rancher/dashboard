import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberModalPo extends EmberComponentPo {
  constructor() {
    super('.modal-open');
  }
}
