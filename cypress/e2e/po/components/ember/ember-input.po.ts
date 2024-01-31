import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberInputPo extends EmberComponentPo {
  /**
   * Type value in the input
   * @param value Value to be typed
   * @returns
   */
  set(value: string): Cypress.Chainable {
    this.input().should('be.visible');
    this.input().focus();
    this.input().clear();

    return this.input().type(value);
  }

  clear() {
    return this.input().clear();
  }

  /**
   * Return the input HTML element from given container
   * @returns HTML Element
   */
  private input(): Cypress.Chainable {
    return this.self();
  }
}
