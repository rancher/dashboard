import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class EnvironmentVariablePo extends ComponentPo {
  addButton() {
    return this.self().find('[data-testid="add-env-var"]').contains('Add Variable');
  }

  getVariableAtIndex(index: number) {
    return this.self().get(`[data-testid="env-var-row-${ index }"]`);
  }

  getVariableByName(name: string) {
    return this.self().find('.name input').contains(name);
  }

  removeButtonAtIndex(index: number) {
    return this.getVariableAtIndex(index).find('.remove button');
  }

  setKeyValueEnvVarAtIndex(name: string, value: string, index: number) {
    this.addButton().click();

    new LabeledSelectPo(this.getVariableAtIndex(index).find('.labeled-select')).toggle();
    new LabeledSelectPo(this.getVariableAtIndex(index).find('.labeled-select')).clickOptionWithLabel('Key/Value Pair');
    LabeledInputPo.bySelector(this.getVariableAtIndex(index), '.name').set(name);
    LabeledInputPo.bySelector(this.getVariableAtIndex(index), '.single-value').set(value);
  }
}
