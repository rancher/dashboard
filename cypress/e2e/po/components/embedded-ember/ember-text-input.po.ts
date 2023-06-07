import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';
import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';

export default class EmberTextInputPo extends IframeComponentPo {
  /**
   * Type value in the input
   * @param value Value to be typed
   * @returns
   */
  set(value: string | null): Cypress.Chainable {
    // this.input().should('be.visible');
    this.input().focus();
    this.input().clear();
    if (value) {
      return this.input().type(value);
    }

    return this.input();
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
