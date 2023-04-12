import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class UnitInputPo extends ComponentPo {
  setValue(value: string): Cypress.Chainable {
    return this.self().find('input').type(value);
  }
}
