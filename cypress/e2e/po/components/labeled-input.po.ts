import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class LabeledInputPo extends ComponentPo {
  static byLabel(self: CypressChainable, label: string): LabeledInputPo {
    return new LabeledInputPo(
      self
        .contains('.labeled-input', label, { includeShadowDom: true })
        .find('input')
    );
  }

  static bySelector(self: CypressChainable, selector: string): LabeledInputPo {
    return new LabeledInputPo(
      self
        .find(`${ selector } input`, { includeShadowDom: true })
    );
  }

  /**
   * Type value in the input
   * @param value Value to be typed
   * @param secret Pass in true to hide sensitive data from logs
   * @param parseSpecialCharSequences Pass in false to disable special character parsing (useful for JSON)
   * @returns
   */
  set(value: any, secret?: boolean, parseSpecialCharSequences?: boolean): Cypress.Chainable {
    this.input().scrollIntoView();
    this.input().should('be.visible');
    this.input().focus();
    this.input().clear();

    const typeOptions: any = {};

    if (secret) {
      typeOptions.log = false;
    }

    if (parseSpecialCharSequences === false) {
      typeOptions.parseSpecialCharSequences = false;
    }

    return this.input().type(value, typeOptions);
  }

  getAttributeValue(attr: string): Cypress.Chainable {
    return this.input().invoke('attr', attr);
  }

  clear() {
    return this.input().clear();
  }

  value(): Cypress.Chainable {
    return this.input().then(($element) => {
      return $element.prop('value');
    });
  }

  expectToBeDisabled(): Cypress.Chainable {
    return this.self().should('have.attr', 'disabled', 'disabled');
  }

  expectToBeEnabled(): Cypress.Chainable {
    return this.self().should('not.have.attr', 'disabled');
  }

  /**
   * Return the input HTML element from given container
   * @returns HTML Element
   */
  private input(): Cypress.Chainable {
    return this.self();
  }
}
