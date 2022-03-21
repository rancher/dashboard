import ComponentPo from '@/cypress/integration/po/components/component.po';

export default class RadioInputPo extends ComponentPo {
  /**
   * Click on the radio input button
   * @returns
   */
  set(): Cypress.Chainable {
    return this.input().click();
  }

  /**
   * Return the radio input button from a given container
   * @returns
   */
  private input(): Cypress.Chainable {
    return this.self()
      .find('input[type=radio]');
  }
}
