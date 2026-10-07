import ResourceYamlEditorPagePo from '@/cypress/e2e/po/pages/explorer/yaml-editor.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import NavActionBarPo from '@/cypress/e2e/po/side-bars/nav-action-bar.po';

/**
 * App shortcuts are handled by a capture listener on the document, so they see a key before the editor
 * does. These check that keys typed in the editor reach it, and that the app shortcuts still work outside
 * it. The editor's own bindings are covered by the RcCodeMirror unit tests, apart from the ones that need
 * layout (line movement), which jsdom does not have.
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
    editor().self().find('.cm-content').realClick();
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

    // Replacing the region shows that the whole document was selected
    cy.realType('x');
    editor().value().should('eq', 'x');
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
    editor().self().find('.cm-content').blur();
    cy.focused().should('not.exist');

    cy.realPress(['Control', 'k']);

    navActionBar.jumpToInput().should('be.focused');
    editor().value().should('eq', 'first: line');
  });
});

// The Dashboard's default keymap preference is Sublime ("Normal human" in the UI).
describe('CodeMirror default (Sublime) shortcuts', { tags: ['@components', '@adminUser', '@standardUser'] }, () => {
  const yamlEditorPage = new ResourceYamlEditorPagePo('resourcequota');
  const editor = () => CodeMirrorPo.first();
  const modKey = Cypress.platform === 'darwin' ? 'Meta' : 'Control';

  const focusDocStart = (value: string) => {
    editor().set(value);
    editor().self().realClick();
    if (Cypress.platform === 'darwin') {
      cy.realPress(['Meta', 'ArrowUp']);
    } else {
      cy.realPress(['Control', 'Home']);
    }
  };

  beforeEach(() => {
    cy.login();
    cy.setUserPreference({ keymap: 'sublime' }, true);

    yamlEditorPage.goTo();
    yamlEditorPage.waitForPage();
    editor().checkVisible();
  });

  it('selects the next occurrence with Mod-D', () => {
    focusDocStart('alpha alpha');

    cy.realPress([modKey, 'd']);
    cy.realPress([modKey, 'd']);
    cy.realType('x');

    editor().value().should('eq', 'x x');
  });

  it('duplicates a line with Mod-Shift-D', () => {
    focusDocStart('alpha\nbeta');

    cy.realPress([modKey, 'Shift', 'd']);

    editor().value().should('eq', 'alpha\nalpha\nbeta');
  });

  it('swaps a line down with the platform Sublime shortcut', () => {
    focusDocStart('alpha\nbeta');

    if (Cypress.platform === 'darwin') {
      cy.realPress(['Control', 'Meta', 'ArrowDown']);
    } else {
      cy.realPress(['Control', 'Shift', 'ArrowDown']);
    }

    editor().value().should('eq', 'beta\nalpha');
  });

  it('selects a line with Mod-L', () => {
    focusDocStart('alpha\nbeta');

    cy.realPress([modKey, 'l']);
    cy.realType('x');

    editor().value().should('eq', 'xbeta');
  });
});

describe('CodeMirror Vim shortcuts', { tags: ['@components', '@adminUser', '@standardUser'] }, () => {
  const yamlEditorPage = new ResourceYamlEditorPagePo('resourcequota');
  const editor = () => CodeMirrorPo.first();

  const focusNormalModeAtStart = (value: string) => {
    editor().set(value);
    editor().self().realClick();
    cy.realPress('Escape');
    cy.realPress('g');
    cy.realPress('g');
  };

  beforeEach(() => {
    cy.login();
    cy.setUserPreference({ keymap: 'vim' }, true);

    yamlEditorPage.goTo();
    yamlEditorPage.waitForPage();
    editor().checkVisible();
  });

  after(() => {
    cy.login();
    cy.setUserPreference({ keymap: 'sublime' });
  });

  it('deletes a line with dd and restores it with u', () => {
    focusNormalModeAtStart('name: app\nreplicas: 2');

    cy.realPress('d');
    cy.realPress('d');
    editor().value().should('eq', 'replicas: 2');

    cy.realPress('u');
    editor().value().should('eq', 'name: app\nreplicas: 2');
  });

  it('writes a YAML list item, yanks it, pastes it, and undoes the paste', () => {
    focusNormalModeAtStart('- name: app');

    cy.realPress('o');
    cy.realType('- name: worker');
    cy.realPress('Escape');
    editor().value().should('eq', '- name: app\n- name: worker');

    cy.realPress('y');
    cy.realPress('y');
    cy.realPress('p');
    editor().value().should('eq', '- name: app\n- name: worker\n- name: worker');

    cy.realPress('u');
    editor().value().should('eq', '- name: app\n- name: worker');
  });
});
