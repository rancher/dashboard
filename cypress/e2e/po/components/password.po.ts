import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class PasswordPo extends ComponentPo {
  /**
   * Type value in the input
   * @param value Value to be typed
   * @returns
   */
  set(value: string): Cypress.Chainable {
    return this.input()
      .focus()
      .type(value);
  }

  /**
   * Retry-able assertion that the input holds the expected value.
   * `cy.type()` can occasionally drop keystrokes under CI load; asserting the settled
   * value before acting (e.g. before submitting a login form) guards against a truncated
   * value being sent. Retries until the reactive model settles.
   * @param value Expected value
   */
  shouldHaveValue(value: string): Cypress.Chainable {
    return this.input().should('have.value', value);
  }

  /**
   * Return the input HTML element from given container
   * @returns HTML Element
   */
  private input(): Cypress.Chainable {
    return this.self()
      .find('input');
  }

  /**
   * Return the SHOW anchor element
   * @returns HTML Element
   */
  showBtn(): Cypress.Chainable {
    return this.self()
      .find('.addon a');
  }
}
