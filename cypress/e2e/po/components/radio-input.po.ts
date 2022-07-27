import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class RadioInputPo extends ComponentPo {
  /**
   * Click on the radio input button
   * @returns
   */
  set(): Cypress.Chainable {
    return this.input().click();
  }

  /**
   * Return the radio label from a given container, as input is hidden and label bound
   * @returns
   */
  private input(): Cypress.Chainable {
    return this.self()
      .find('.radio-label');
  }
}
