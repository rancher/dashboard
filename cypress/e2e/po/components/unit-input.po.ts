import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class UnitInputPo extends ComponentPo {
  setValue(value: string): Cypress.Chainable {
    return new LabeledInputPo(this.self().find('input')).set(value);
  }

  clear() {
    return this.self().clear();
  }
}
