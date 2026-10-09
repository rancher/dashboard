import { EditorState } from '@codemirror/state';
import { EditorView, runScopeHandlers } from '@codemirror/view';
import { closeSearchPanel, searchPanelOpen } from '@codemirror/search';
import { getKeymapExtension } from '@components/RcCodeMirror/extensions/keymaps';
import { keepSearchPanelOpen } from '@shell/utils/code-mirror-search';

describe('fx: keepSearchPanelOpen', () => {
  let view: EditorView;

  // An editor with RcCodeMirror's key bindings and search panel, on the page so it can take the focus
  const createView = () => {
    view = new EditorView({
      doc: 'replicas: 2\nsachet: true\n', extensions: [getKeymapExtension()], parent: document.body
    });

    return view;
  };
  const field = () => document.querySelector('.cm-search [main-field]');
  const press = (init: ConstructorParameters<typeof KeyboardEvent>[1]) => runScopeHandlers(view, new KeyboardEvent('keydown', init), 'editor');

  afterEach(() => {
    jest.restoreAllMocks();
    view.destroy();
    document.body.innerHTML = '';
  });

  it('opens the search panel', () => {
    keepSearchPanelOpen(createView());

    expect(searchPanelOpen(view.state)).toBe(true);
  });

  it('names the search field with the placeholder', () => {
    keepSearchPanelOpen(createView(), { placeholder: 'Search values...' });

    expect([field()?.getAttribute('placeholder'), field()?.getAttribute('aria-label')]).toStrictEqual(['Search values...', 'Search values...']);
  });

  it('wins over the editor\'s own translation of the field name', () => {
    view = new EditorView({
      doc: '', extensions: [getKeymapExtension(), EditorState.phrases.of({ Find: 'Find it' })], parent: document.body
    });
    keepSearchPanelOpen(view, { placeholder: 'Search values...' });

    expect(field()?.getAttribute('placeholder')).toStrictEqual('Search values...');
  });

  it('keeps CodeMirror\'s field name without a placeholder', () => {
    keepSearchPanelOpen(createView());

    expect(field()?.getAttribute('placeholder')).toStrictEqual('Find');
  });

  it('puts the panel in the container', () => {
    const container = document.createElement('div');

    document.body.appendChild(container);
    keepSearchPanelOpen(createView(), { container });

    expect(container.querySelector('.cm-search [main-field]')).toStrictEqual(field());
  });

  it('keeps the panel at the top of the editor without a container', () => {
    keepSearchPanelOpen(createView());

    expect(view.dom.querySelector('.cm-panels-top .cm-search')).not.toBeNull();
  });

  it('keeps the panel open when something closes it', () => {
    keepSearchPanelOpen(createView());

    closeSearchPanel(view);

    expect(searchPanelOpen(view.state)).toBe(true);
  });

  it('lets other changes through', () => {
    keepSearchPanelOpen(createView());

    view.dispatch({ changes: { from: 0, insert: 'name: a\n' } });

    expect(view.state.doc.line(1).text).toStrictEqual('name: a');
  });

  it('keeps the focus where it was when the panel opens', () => {
    const button = document.createElement('button');

    // The panel selects its field when it opens, which in a browser (unlike jsdom) also focuses it
    jest.spyOn(HTMLInputElement.prototype, 'select').mockImplementation(function(this: HTMLInputElement) {
      this.focus();
    });
    document.body.appendChild(button);
    button.focus();
    keepSearchPanelOpen(createView());

    expect(document.activeElement).toStrictEqual(button);
  });

  it('moves the focus to the panel on Mod-F, which would otherwise close it', () => {
    keepSearchPanelOpen(createView());

    view.focus();
    press({ key: 'f', ctrlKey: true });

    expect(searchPanelOpen(view.state)).toBe(true);
    expect(document.activeElement).toStrictEqual(field());
  });

  describe('in Vim mode', () => {
    const createVimView = () => {
      view = new EditorView({
        doc: 'replicas: 2\nsachet: true\n', extensions: [getKeymapExtension('vim')], parent: document.body
      });

      return view;
    };
    const pressInField = (init: ConstructorParameters<typeof KeyboardEvent>[1]) => field()?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));

    it('uses RcCodeMirror\'s search panel instead of CodeMirror\'s', () => {
      keepSearchPanelOpen(createVimView());

      expect([document.querySelector('.cm-search-field') !== null, document.querySelector('.cm-search [name=replace]')]).toStrictEqual([true, null]);
    });

    it('leaves Ctrl-F in the editor to Vim', () => {
      keepSearchPanelOpen(createVimView());

      view.focus();
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'f', ctrlKey: true, bubbles: true
      }));

      expect(document.activeElement).not.toStrictEqual(field());
    });

    it.each([
      ['F3', { key: 'F3' }],
      ['Mod-G', { key: 'g', ctrlKey: true }],
    ])('goes to the next match on %s in the panel', (_, init) => {
      keepSearchPanelOpen(createVimView());
      (field() as HTMLInputElement).value = 'a';
      field()?.dispatchEvent(new Event('input', { bubbles: true }));

      pressInField(init);

      // From the "a" of replicas to the "a" of sachet
      expect(view.state.selection.main.from).toStrictEqual(13);
    });

    it('goes back to the editor on Escape in the panel', () => {
      keepSearchPanelOpen(createVimView());

      (field() as HTMLInputElement).focus();
      pressInField({ key: 'Escape' });

      expect(view.hasFocus).toBe(true);
    });
  });

  it('goes back to the editor on Escape in the panel', () => {
    keepSearchPanelOpen(createView());

    (field() as HTMLInputElement).focus();
    runScopeHandlers(view, new KeyboardEvent('keydown', { key: 'Escape' }), 'search-panel');

    expect(searchPanelOpen(view.state)).toBe(true);
    expect(view.hasFocus).toBe(true);
  });
});
