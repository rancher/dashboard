import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';
import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';

export default class EmberTextInputPo extends IframeComponentPo {
  // static byLabel(self: CypressChainable, label: string): EmberTextInputPo {
  //   return new EmberTextInputPo(
  //     self
  //       .find('.ember-text-field', { includeShadowDom: true })
  //       .contains(label)
  //       .next()
  //   );
  // }

  /**
   * Type value in the input
   * @param value Value to be typed
   * @returns
   */
  set(value: string): Cypress.Chainable {
    // this.input().should('be.visible');
    this.input().focus();
    this.input().clear();
    console.log('e2e ember text input', this.input());

    return this.input().type(value);
  }

  clear() {
    return this.input().clear();
  }

  value(): Cypress.Chainable {
    throw new Error('Not implements');
    // The text for the input field is in a shadow dom element. Neither the proposed two methods
    // to dive in to the shadow dom work
    // return this.input().find('div', { includeShadowDom: true }).invoke('text');
    // return this.input().shadow().find('div').invoke('text');
  }

  /**
   * Return the input HTML element from given container
   * @returns HTML Element
   */
  private input(): Cypress.Chainable {
    return this.self();
  }
}
