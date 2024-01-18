import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';

export default class EmberFormRkeTemplatesPo extends EmberComponentPo {
  templateDetails(): EmberInputPo {
    return new EmberInputPo('[data-testid="form-name-description__name"]');
  }

  create() {
    return this.self().contains('[data-testid="save-cancel-rke1"] button', 'Create').click();
  }

  save() {
    return this.self().contains('[data-testid="save-cancel-rke1"] button', 'Save').click();
  }
}
