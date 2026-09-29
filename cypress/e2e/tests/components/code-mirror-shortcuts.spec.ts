import ResourceYamlEditorPagePo from '@/cypress/e2e/po/pages/explorer/yaml-editor.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import NavActionBarPo from '@/cypress/e2e/po/side-bars/nav-action-bar.po';

/**
 * App shortcuts are handled by a capture listener on the document, so they see a key before the editor
 * does. These check that keys typed in the editor reach it, and that the app shortcuts still work outside
 * it. They only use the editor through the page object and the focused element, so they hold for any
 * editor implementation.
 *
 * Keys are sent with cypress-real-events, which dispatches them through the Chrome DevTools Protocol. That
 * reaches the page the way typing does, but it skips the browser's own shortcuts, so a key the browser
 * keeps for itself (Ctrl-N, Ctrl-T, Ctrl-W) would pass here and still never reach the editor for a person.
 * Only use keys that browsers let the page handle.
 */
describe('CodeMirror editor shortcuts', { tags: ['@components', '@adminUser', '@standardUser'] }, () => {
  const yamlEditorPage = new ResourceYamlEditorPagePo('resourcequota');
  const navActionBar = new NavActionBarPo();

  const editor = () => CodeMirrorPo.first();

  // Emacs M-< and M->. Ctrl-Home and Ctrl-End do nothing on a Mac, and these also cover the Alt (Meta) path,
  // where an unhandled Option key on a Mac types a character.
  const goDocStart = () => cy.realPress(['Alt', 'Shift', '<']);
  const goDocEnd = () => cy.realPress(['Alt', 'Shift', '>']);

  // Put the cursor at the start of the document with the editor focused
  const focusDocStart = (value: string) => {
    editor().set(value);
    editor().self().realClick();
    goDocStart();
  };

  beforeEach(() => {
    cy.login();
    // The keymap preference is read when the editor mounts, so it has to be saved before the page loads
    cy.setUserPreference({ keymap: 'emacs' }, true);

    yamlEditorPage.goTo();
    yamlEditorPage.waitForPage();
    editor().checkVisible();
  });

  // Test isolation clears the session between tests, so log in again before resetting the preference
  after(() => {
    cy.login();
    cy.setUserPreference({ keymap: 'sublime' });
  });

  it('sends Ctrl-K in the editor to Emacs kill-line instead of the navigation search', () => {
    focusDocStart('first: line\nsecond: line');

    cy.realPress(['Control', 'k']);

    editor().value().should('eq', '\nsecond: line');
    navActionBar.jumpToInput().should('not.be.focused');
  });

  it('restores killed text with Ctrl-Y', () => {
    focusDocStart('alpha beta gamma');

    cy.realPress(['Control', 'k']);
    editor().value().should('eq', '');
    cy.realPress(['Control', 'y']);

    editor().value().should('eq', 'alpha beta gamma');
    navActionBar.jumpToInput().should('not.be.focused');
  });

  it('undoes typed text with Ctrl-/ and redoes it with Ctrl-Shift-Z', () => {
    focusDocStart('alpha');
    goDocEnd();
    cy.realType('x');
    editor().value().should('eq', 'alphax');

    cy.realPress(['Control', '/']);
    editor().value().should('eq', 'alpha');

    cy.realPress(['Control', 'Shift', 'z']);
    editor().value().should('eq', 'alphax');
  });

  it('moves to the start of the document with M-<', () => {
    focusDocStart('first: line\nsecond: line');
    goDocEnd();

    goDocStart();
    cy.realPress(['Control', 'k']);

    editor().value().should('eq', '\nsecond: line');
  });

  it('kills the next word with M-d', () => {
    focusDocStart('alpha beta gamma');

    cy.realPress(['Alt', 'd']);

    editor().value().should('eq', ' beta gamma');
  });

  it('copies the region with M-w and yanks it with Ctrl-Y', () => {
    focusDocStart('alpha beta gamma');

    cy.realPress(['Control', 'Space']);
    for (let i = 0; i < 5; i++) {
      cy.realPress(['Control', 'f']);
    }
    cy.realPress(['Alt', 'w']);
    cy.realPress(['Control', 'e']);
    cy.realPress(['Control', 'y']);

    editor().value().should('eq', 'alpha beta gammaalpha');
  });

  // A two key chord: the second key must not be typed into the text or taken by the app
  it('selects the whole document with Ctrl-X H', () => {
    focusDocStart('first: line\nsecond: line');

    cy.realPress(['Control', 'x']);
    cy.realPress('h');
    editor().value().should('eq', 'first: line\nsecond: line');

    // Killing the region shows what was selected
    cy.realPress(['Control', 'w']);
    editor().value().should('eq', '');
  });

  // Page down depends on the real layout, so only check that the cursor moved more than one line
  it('moves down a page with Ctrl-V without pasting', () => {
    const lines = Array.from({ length: 200 }, (_, i) => `line${ i }: value`);

    focusDocStart(lines.join('\n'));

    cy.realPress(['Control', 'v']);
    cy.realPress(['Control', 'k']);

    editor().value().then((value: string) => {
      const after = value.split('\n');
      const killed = after.indexOf('');

      expect(after).to.have.length(lines.length);
      expect(killed).to.be.greaterThan(1);
      expect(after.filter((line, i) => line !== lines[i])).to.deep.equal(['']);
    });
  });

  it('moves one character with Ctrl-F before killing the rest of the line', () => {
    focusDocStart('alpha');

    cy.realPress(['Control', 'f']);
    cy.realPress(['Control', 'k']);

    editor().value().should('eq', 'a');
    navActionBar.jumpToInput().should('not.be.focused');
  });

  it('deletes the previous character with Ctrl-H', () => {
    focusDocStart('alpha');
    cy.realPress(['Control', 'e']);

    cy.realPress(['Control', 'h']);

    editor().value().should('eq', 'alph');
  });

  // Ctrl-N (next line) has no equivalent test: Chrome and Firefox open a new window before the page sees it
  it('moves to the previous line with Ctrl-P', () => {
    focusDocStart('first: line\nsecond: line\nthird: line');

    goDocEnd();
    cy.realPress(['Control', 'a']);
    cy.realPress(['Control', 'p']);
    cy.realPress(['Control', 'k']);

    editor().value().should('eq', 'first: line\n\nthird: line');
  });

  it('opens the navigation search with Ctrl-K outside the editor', () => {
    focusDocStart('first: line');
    cy.focused().blur();
    cy.focused().should('not.exist');

    cy.realPress(['Control', 'k']);

    navActionBar.jumpToInput().should('be.focused');
    editor().value().should('eq', 'first: line');
  });
});
