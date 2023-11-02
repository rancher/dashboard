import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberInputPo extends EmberComponentPo {
  /**
   * Type value in the input
   * @param value Value to be typed
   * @returns
   */
  set(value: string, index = 0): Cypress.Chainable {
    this.input().eq(index).should('be.visible');
    this.input().eq(index).focus();
    this.input().eq(index).clear();

    return this.input().eq(index).type(value);
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
