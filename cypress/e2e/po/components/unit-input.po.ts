import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class UnitInputPo extends ComponentPo {
  setValue(value: string | number): Cypress.Chainable {
    return new LabeledInputPo(this.self().find('input')).set(value);
  }

  clear() {
    // Target the inner <input>, not the wrapper element. Cypress 12's stricter
    // action-command element resolution no-ops .clear() on the wrapper, which
    // stops @update:value('') from firing (see UnitInputPo.setValue above).
    return this.self().find('input').clear();
  }
}
