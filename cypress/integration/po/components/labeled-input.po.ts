import ComponentPo from '@/cypress/integration/po/components/component.po';

export default class LabeledInputPo extends ComponentPo {
  set(value: string): Cypress.Chainable {
    return this.input()
      .focus()
      .type(value);
  }

  private input(): Cypress.Chainable {
    return this.self()
      .find('input');
  }
}
