import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class RadioGroupInputPo extends ComponentPo {
  /**
   * Select nth radio input from a given group
   * @param value
   * @returns
   */
  set(value: number): Cypress.Chainable {
    return this.input(value).click();
  }

  /**
   * Return the nth radio label from a given group, as input is hidden and label bound
   * @param value position of the radio from the group
   * @returns
   */
  private input(value: number): Cypress.Chainable {
    return this.self()
      .find('.radio-label').eq(value);
  }
}
