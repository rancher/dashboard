import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberCheckboxInputPo extends EmberComponentPo {
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
    return this.self().find('.ember-checkbox');
  }

  checkOptionSelected() {
    return this.input().should('be.checked');
  }
}
