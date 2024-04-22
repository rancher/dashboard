import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberTextareaPo extends EmberComponentPo {
  /**
   * Type value in the input
   * @param value Value to be typed
   * @param secret Pass in true to hide sensitive data from logs
   * @returns
   */
  set(value: string, secret?: boolean): Cypress.Chainable {
    this.input().should('be.visible');
    this.input().focus();
    this.input().clear();

    if (secret) {
      return this.input().type(value, { log: false });
    } else {
      return this.input().type(value);
    }
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
