import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class CodeMirrorPo extends ComponentPo {
  static byLabel(self: CypressChainable, label: string): CodeMirrorPo {
    throw new Error('Not implemented');
  }

  static bySelector(self: CypressChainable, selector: string): CodeMirrorPo {
    return new CodeMirrorPo(
      self
        .find(`${ selector } .CodeMirror`, { includeShadowDom: true })
    );
  }

  /**
   * Type value in the input
   * @param value Value to be typed
   * @returns
   */
  set(value: string): Cypress.Chainable {
    this.input().should('be.visible');

    return this.input()
      .then(($codeMirror) => {
        const codeMirrorInstance = $codeMirror[0].CodeMirror;

        codeMirrorInstance.setValue(value);
      });
  }

  clear() {
    return this.input().clear();
  }

  value(): Cypress.Chainable {
    return this.input()
      .then(($codeMirror) => {
        const codeMirrorInstance = $codeMirror[0].CodeMirror;

        return codeMirrorInstance.getValue();
      });
  }

  /**
   * Return the input HTML element from given container
   * @returns HTML Element
   */
  private input(): Cypress.Chainable {
    return this.self();
  }
}
