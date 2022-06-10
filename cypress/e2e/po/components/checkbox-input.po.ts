import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class CheckboxInputPo extends ComponentPo {
  /**
   * Click on the checkbox input button
   * @returns
   */
  set(): Cypress.Chainable {
    return this.input().click({ force: true });
  }

  /**
   * Return the checkbox input button from a given container
   * @returns
   */
  private input(): Cypress.Chainable {
    return this.self()
      .find('.checkbox-container');
  }
}
