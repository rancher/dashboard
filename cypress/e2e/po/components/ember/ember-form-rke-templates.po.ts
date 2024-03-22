import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';

export default class EmberFormRkeTemplatesPo extends EmberComponentPo {
  templateDetails(index): EmberInputPo {
    return new EmberInputPo(`.horizontal-form .row:nth-of-type(1) input:nth-child(${ index })`);
  }

  create() {
    return this.self().contains('[data-testid="save-cancel-rke1"] button', 'Create').click();
  }

  save() {
    return this.self().contains('[data-testid="save-cancel-rke1"] button', 'Save').click();
  }
}
