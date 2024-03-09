import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberRadioInputPo extends EmberComponentPo {
  /**
   * Click on the Radio input button
   * @returns
   */
  set(): Cypress.Chainable {
    return this.input().click({ force: true });
  }

  /**
   * Return the Radio input button from a given container
   * @returns
   */
  private input(): Cypress.Chainable {
    return this.self();
  }
}
