import { EditorView } from '@codemirror/view';
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

/**
 * Editors are CodeMirror 6 (`.cm-editor`). CodeMirror 5 (`.CodeMirror`) is still supported for
 * tests that run against older Rancher versions, such as the extension compatibility tests
 */
const EDITOR_SELECTOR = '.cm-editor, .CodeMirror';

export default class CodeMirrorPo extends ComponentPo {
  static byLabel(self: CypressChainable, label: string): CodeMirrorPo {
    throw new Error('Not implemented');
  }

  static bySelector(self: CypressChainable, selector: string): CodeMirrorPo {
    return new CodeMirrorPo(
      self
        .find(EDITOR_SELECTOR.split(', ').map((editor) => `${ selector } ${ editor }`).join(', '), { includeShadowDom: true })
    );
  }

  /**
   * Find the first editor on the page
   */
  static first(options?: Partial<Cypress.Timeoutable>): CodeMirrorPo {
    return new CodeMirrorPo(cy.get(EDITOR_SELECTOR, options).first());
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
        const legacyInstance = $codeMirror[0].CodeMirror;

        if (legacyInstance) {
          legacyInstance.setValue(value);

          return;
        }

        const view = EditorView.findFromDOM($codeMirror[0]);

        view?.dispatch({
          changes: {
            from: 0, to: view.state.doc.length, insert: value
          }
        });
      });
  }

  clear() {
    return this.set('');
  }

  value(): Cypress.Chainable {
    return this.input()
      .then(($codeMirror) => {
        const legacyInstance = $codeMirror[0].CodeMirror;

        if (legacyInstance) {
          return legacyInstance.getValue();
        }

        return EditorView.findFromDOM($codeMirror[0])?.state.doc.toString();
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
