import { EditorSelection, EditorState, type Extension } from '@codemirror/state';
import { EditorView, runScopeHandlers } from '@codemirror/view';
import { foldedRanges, getIndentUnit, indentUnit } from '@codemirror/language';
import { completeAnyWord } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { foldAllComments, foldMatchingLines, foldYamlPath } from '@components/RcCodeMirror';
import { codeMirror5OptionExtensions, resetDeprecationWarnings, toKeyName, withCodeMirror5Api } from '@shell/utils/codemirror-compat';

jest.mock('@components/RcCodeMirror', () => ({
  foldAllComments:   jest.fn(),
  foldMatchingLines: jest.fn(),
  foldYamlPath:      jest.fn(),
}));

function createView(doc = '', extensions: Extension[] = [], cursor = 0): any {
  return withCodeMirror5Api(new EditorView({
    state: EditorState.create({
      doc, extensions, selection: EditorSelection.cursor(cursor)
    })
  }));
}

function pressKey(view: EditorView, key: string, init: { ctrlKey?: boolean } = {}): boolean {
  return runScopeHandlers(view, new KeyboardEvent('keydown', { key, ...init }), 'editor');
}

describe('codemirror-compat', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    resetDeprecationWarnings();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('withCodeMirror5Api', () => {
    it('should return the view it was given', () => {
      const view = new EditorView({ doc: '' });

      expect(withCodeMirror5Api(view)).toBe(view);
    });

    it('should not add the methods to a view twice', () => {
      const view = createView('foo');
      const getValue = view.getValue;

      expect(withCodeMirror5Api(view)).toBe(view);
      expect(view.getValue).toBe(getValue);
    });

    it('should keep the CodeMirror 6 API', () => {
      const view = createView('foo');

      expect(view.focus).toBe(EditorView.prototype.focus);
      expect(view.state.doc.toString()).toStrictEqual('foo');
    });

    it('should warn that a method is deprecated', () => {
      createView('foo').getValue();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`getValue()` is from CodeMirror 5 and is deprecated'));
    });

    it('should only warn about a method once', () => {
      const view = createView('foo');

      view.getValue();
      view.getValue();
      createView('bar').getValue();

      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('should get the value', () => {
      expect(createView('foo: bar').getValue()).toStrictEqual('foo: bar');
    });

    it('should set the value', () => {
      const view = createView('foo: bar');

      view.setValue('baz: qux');

      expect(view.state.doc.toString()).toStrictEqual('baz: qux');
    });

    it('should clear the value when set to undefined', () => {
      const view = createView('foo: bar');

      view.setValue(undefined);

      expect(view.state.doc.toString()).toStrictEqual('');
    });

    it('should request a measure on refresh', () => {
      const view = createView();
      const requestMeasure = jest.spyOn(view, 'requestMeasure');

      view.refresh();

      expect(requestMeasure).toHaveBeenCalledWith();
    });

    it('should return the editor element as the wrapper element', () => {
      const view = createView();

      expect(view.getWrapperElement()).toBe(view.dom);
    });

    it.each([
      [[yaml()], 'yaml'],
      [[json()], 'json'],
      [[], 'null'],
    ])('should name the mode after the language', (extensions, name) => {
      expect(createView('', extensions).getMode()).toStrictEqual({ name });
    });

    it('should keep changes to the mode', () => {
      const view = createView();

      view.getMode().fold = 'yamlcomments';

      expect(view.getMode().fold).toStrictEqual('yamlcomments');
    });

    it.each([
      ['', false],
      ['foo', true],
    ])('should report whether %p is selected', (selected, somethingSelected) => {
      const view = createView('foo');

      view.dispatch({ selection: { anchor: 0, head: selected.length } });

      expect(view.somethingSelected()).toStrictEqual(somethingSelected);
    });

    it('should get the selected text', () => {
      const view = createView('foo bar');

      view.dispatch({ selection: { anchor: 4, head: 7 } });

      expect(view.getSelection()).toStrictEqual('bar');
    });

    it('should replace the selected text', () => {
      const view = createView('foo bar');

      view.dispatch({ selection: { anchor: 4, head: 7 } });
      view.replaceSelection('baz');

      expect(view.state.doc.toString()).toStrictEqual('foo baz');
    });

    it.each([
      ['add', 'foo', '  foo'],
      ['subtract', '  foo', 'foo'],
    ])('should %p indentation to the selection', (how, doc, expected) => {
      const view = createView(doc);

      view.indentSelection(how);

      expect(view.state.doc.toString()).toStrictEqual(expected);
    });

    it('should get the cursor as a zero based line and character', () => {
      expect(createView('foo\nbar', [], 6).getCursor()).toStrictEqual({ line: 1, ch: 2 });
    });

    it.each([
      [[1, 2]],
      [[{ line: 1, ch: 2 }]],
    ])('should set the cursor from %p', (args) => {
      const view = createView('foo\nbar');

      view.setCursor(...args);

      expect(view.state.selection.main.head).toStrictEqual(6);
    });

    it('should keep the cursor within the document', () => {
      const view = createView('foo\nbar');

      view.setCursor(10, 10);

      expect(view.state.selection.main.head).toStrictEqual(7);
    });

    it('should count the lines', () => {
      expect(createView('foo\nbar').lineCount()).toStrictEqual(2);
    });

    it.each([
      [0, 'foo'],
      [1, 'bar'],
      [2, undefined],
    ])('should get zero based line %p', (line, text) => {
      expect(createView('foo\nbar').getLine(line)).toStrictEqual(text);
    });

    it('should fold lines matching a pattern', () => {
      const view = createView('status:\n  foo: bar');

      view.foldLinesMatching(/^status:/);

      expect(foldMatchingLines).toHaveBeenCalledWith(view, /^status:/);
    });

    it('should fold a yaml path', () => {
      const view = createView('metadata:\n  labels: {}');

      view.foldYaml('metadata.labels');

      expect(foldYamlPath).toHaveBeenCalledWith(view, 'metadata.labels');
    });
  });

  describe('execCommand', () => {
    it('should fold everything', () => {
      const view = createView('{\n  "foo": [\n    1\n  ]\n}', [json()]);

      view.execCommand('foldAll');

      expect(foldedRanges(view.state).size).toStrictEqual(1);
    });

    it('should fold comments when the mode folds yaml comments', () => {
      const view = createView('# foo\n#   bar', [yaml()]);

      view.getMode().fold = 'yamlcomments';
      view.execCommand('foldAll');

      expect(foldAllComments).toHaveBeenCalledWith(view);
    });

    it('should unfold everything', () => {
      const view = createView('{\n  "foo": [\n    1\n  ]\n}', [json()]);

      view.execCommand('foldAll');
      view.execCommand('unfoldAll');

      expect(foldedRanges(view.state).size).toStrictEqual(0);
    });

    it.each([
      ['ab', 2, 4, 'ab  '],
      ['abcd', 4, 4, 'abcd    '],
      ['a', 1, 2, 'a '],
    ])('should insert a soft tab in %p at %p with tab size %p', (doc, cursor, tabSize, expected) => {
      const view = createView(doc, [EditorState.tabSize.of(tabSize)], cursor);

      view.execCommand('insertSoftTab');

      expect(view.state.doc.toString()).toStrictEqual(expected);
    });

    it('should select all', () => {
      const view = createView('foo bar');

      view.execCommand('selectAll');

      expect(view.getSelection()).toStrictEqual('foo bar');
    });

    it('should warn about an unsupported command', () => {
      createView('foo').execCommand('transposeChars');

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`transposeChars` command'));
    });

    it('should leave the document unchanged for an unsupported command', () => {
      const view = createView('foo');

      view.execCommand('transposeChars');

      expect(view.state.doc.toString()).toStrictEqual('foo');
    });
  });

  describe('toKeyName', () => {
    it.each([
      ['Tab', 'Tab'],
      ['Shift-Tab', 'Shift-Tab'],
      ['Ctrl-Space', 'Ctrl-Space'],
      ['Ctrl-A', 'Ctrl-a'],
      ['Shift-Ctrl-Z', 'Shift-Ctrl-z'],
      ['F5', 'F5'],
      ['Esc', 'Escape'],
      ['Shift-Esc', 'Shift-Escape'],
      ['Alt-Up', 'Alt-ArrowUp'],
      ['Ctrl-Alt-Down', 'Ctrl-Alt-ArrowDown'],
      ['Ctrl--', 'Ctrl--'],
      ['Ctrl-K Ctrl-Left', 'Ctrl-k Ctrl-ArrowLeft'],
    ])('should convert %p to %p', (name, expected) => {
      expect(toKeyName(name)).toStrictEqual(expected);
    });
  });

  describe('codeMirror5OptionExtensions', () => {
    it.each([
      [{}],
      [undefined],
      [{
        mode: 'yaml', readOnly: true, lint: true, lineNumbers: true, foldGutter: true, lineWrapping: true, screenReaderLabel: 'Values'
      }],
    ])('should not translate the CodeMirror component options %p', (options) => {
      expect(codeMirror5OptionExtensions(options)).toStrictEqual([]);
    });

    it('should not warn about the CodeMirror component options', () => {
      codeMirror5OptionExtensions({ mode: 'yaml', readOnly: true });

      expect(warn).not.toHaveBeenCalledWith(expect.anything());
    });

    it('should ignore options without a value', () => {
      codeMirror5OptionExtensions({ tabSize: undefined });

      expect(warn).not.toHaveBeenCalledWith(expect.anything());
    });

    it.each([
      'gutters',
      'theme',
    ])('should warn that the %p option has no effect', (name) => {
      expect(codeMirror5OptionExtensions({ [name]: 'foo' })).toStrictEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(`\`${ name }\` option is from CodeMirror 5 and is deprecated. It has no effect.`));
    });

    it('should warn that a translated option is deprecated', () => {
      codeMirror5OptionExtensions({ tabSize: 4 });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`tabSize` option is from CodeMirror 5 and is deprecated. Pass `EditorState.tabSize.of(size)`'));
    });

    it('should set the tab size', () => {
      const state = EditorState.create({ extensions: codeMirror5OptionExtensions({ tabSize: 8 }) });

      expect(state.tabSize).toStrictEqual(8);
    });

    it.each([
      [{ indentWithTabs: true }, '\t'],
      [{ indentWithTabs: true, indentUnit: 4 }, '\t'],
      [{ indentWithTabs: false, indentUnit: 4 }, '    '],
      [{ indentUnit: 3 }, '   '],
      [{ indentWithTabs: false }, '  '],
    ])('should set the indent unit from %p', (options, unit) => {
      const state = EditorState.create({ extensions: codeMirror5OptionExtensions(options) });

      expect(state.facet(indentUnit)).toStrictEqual(unit);
    });

    it('should indent with tabs the size of a tab', () => {
      const state = EditorState.create({ extensions: codeMirror5OptionExtensions({ indentWithTabs: true, tabSize: 4 }) });

      expect(getIndentUnit(state)).toStrictEqual(4);
    });

    it.each([
      [true, 1],
      [false, 0],
    ])('should highlight the active line when styleActiveLine is %p', (styleActiveLine, count) => {
      const view = new EditorView({ extensions: codeMirror5OptionExtensions({ styleActiveLine }) });

      expect(view.dom.querySelectorAll('.cm-activeLine')).toHaveLength(count);
    });

    describe('extraKeys', () => {
      it('should call a handler with the view and its CodeMirror 5 methods', () => {
        const handler = jest.fn((cm) => cm.replaceSelection(cm.somethingSelected() ? 'selected' : 'none'));
        const view = new EditorView({ extensions: codeMirror5OptionExtensions({ extraKeys: { 'Ctrl-Space': handler } }) });

        pressKey(view, ' ', { ctrlKey: true });

        expect(handler).toHaveBeenCalledWith(view);
        expect(view.state.doc.toString()).toStrictEqual('none');
      });

      it('should handle a key the handler handles', () => {
        const view = new EditorView({ extensions: codeMirror5OptionExtensions({ extraKeys: { Tab: jest.fn() } }) });

        expect(pressKey(view, 'Tab')).toStrictEqual(true);
      });

      it('should pass on a key when the handler returns CodeMirror.Pass', () => {
        const pass = { toString: () => 'CodeMirror.Pass' };
        const view = new EditorView({ extensions: codeMirror5OptionExtensions({ extraKeys: { Tab: () => pass } }) });

        expect(pressKey(view, 'Tab')).toStrictEqual(false);
      });

      it('should run a named command', () => {
        const view = new EditorView({ doc: 'foo', extensions: codeMirror5OptionExtensions({ extraKeys: { 'Ctrl-A': 'selectAll' } }) });

        pressKey(view, 'a', { ctrlKey: true });

        expect(view.state.selection.main.to).toStrictEqual(3);
      });

      it('should convert CodeMirror 5 key names', () => {
        const handler = jest.fn();
        const view = new EditorView({ extensions: codeMirror5OptionExtensions({ extraKeys: { Esc: handler } }) });

        pressKey(view, 'Escape');

        expect(handler).toHaveBeenCalledWith(view);
      });

      it('should not bind a key set to false', () => {
        const view = new EditorView({ extensions: codeMirror5OptionExtensions({ extraKeys: { Tab: false } }) });

        expect(pressKey(view, 'Tab')).toStrictEqual(false);
      });

      it('should complete words from the document when a key runs autocomplete', () => {
        const state = EditorState.create({ extensions: codeMirror5OptionExtensions({ extraKeys: { 'Ctrl-Space': 'autocomplete' } }) });

        expect(state.languageDataAt('autocomplete', 0)).toContain(completeAnyWord);
      });

      it('should not complete words from the document without an autocomplete key', () => {
        const state = EditorState.create({ extensions: codeMirror5OptionExtensions({ extraKeys: { Tab: 'indentMore' } }) });

        expect(state.languageDataAt('autocomplete', 0)).not.toContain(completeAnyWord);
      });
    });
  });
});
