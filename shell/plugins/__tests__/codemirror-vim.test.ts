import 'codemirror/mode/yaml/yaml';
import 'codemirror/keymap/vim';

type Position = { line: number; ch: number };
type CM5Editor = {
  state: { vim: { insertMode: boolean } };
  getWrapperElement: () => HTMLElement;
  getValue: () => string;
  getCursor: () => Position;
  setCursor: (line: number, ch: number) => void;
  replaceSelection: (text: string) => void;
};

// CM5 has no TypeScript declarations in Dashboard's dependency tree.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CodeMirror = require('codemirror') as {
  (parent: HTMLElement, options: Record<string, unknown>): CM5Editor;
  Vim: {
    handleKey: (cm: CM5Editor, key: string) => boolean | undefined;
    handleEx: (cm: CM5Editor, command: string) => void;
    resetVimGlobalState_: () => void;
  };
};

function parseDoc(marked: string): { doc: string; cursor: Position } {
  const offset = marked.indexOf('|');
  const doc = marked.replace('|', '');
  const lines = marked.slice(0, offset).split('\n');

  return { doc, cursor: { line: lines.length - 1, ch: lines[lines.length - 1].length } };
}

describe('CM5 Vim baseline', () => {
  let cm: CM5Editor;
  let getBoundingClientRect: typeof Range.prototype.getBoundingClientRect;
  let getClientRects: typeof Range.prototype.getClientRects;

  function editor(marked: string) {
    const { doc, cursor } = parseDoc(marked);

    cm = CodeMirror(document.body, {
      value: doc, keyMap: 'vim', mode: 'yaml', indentUnit: 2
    });
    cm.setCursor(cursor.line, cursor.ch);
  }

  function keys(sequence: string) {
    sequence.match(/<[^>]+>|./g)?.forEach((key) => CodeMirror.Vim.handleKey(cm, key));
  }

  beforeAll(() => {
    getBoundingClientRect = Range.prototype.getBoundingClientRect;
    getClientRects = Range.prototype.getClientRects;
    const rect = {
      left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0
    } as DOMRect;

    Range.prototype.getBoundingClientRect = () => rect;
    Range.prototype.getClientRects = () => [rect] as unknown as DOMRectList;
  });

  afterAll(() => {
    Range.prototype.getBoundingClientRect = getBoundingClientRect;
    Range.prototype.getClientRects = getClientRects;
  });

  beforeEach(() => CodeMirror.Vim.resetVimGlobalState_());
  afterEach(() => cm?.getWrapperElement().remove());

  it.each([
    ['moves by word', 'w', '|alpha beta', 'alpha |beta'],
    ['moves backward by word', 'b', 'alpha |beta', '|alpha beta'],
    ['moves to the end of a line', '$', '|alpha beta', 'alpha bet|a'],
    ['moves to the first line', 'gg', 'first\n|second', '|first\nsecond'],
    ['moves to the last line', 'G', '|first\nsecond', 'first\n|second'],
    ['deletes the current line', 'dd', '|first\nsecond', '|second'],
    ['deletes two lines with a count', '2dd', '|first\nsecond\nthird', '|third'],
    ['deletes a word with an operator and motion', 'dw', '|first second', '|second'],
    ['deletes an inner word text object', 'diw', 'first |second', 'first| '],
    ['deletes a character', 'x', '|first', '|irst'],
    ['joins lines', 'J', '|first\nsecond', 'first| second'],
    ['indents a line', '>>', '|first\nsecond', '  |first\nsecond'],
    ['deletes a Visual selection', 'vld', '|first', '|rst'],
    ['undoes a deletion', 'ddu', '|first\nsecond', '|first\nsecond'],
    ['redoes an undone deletion', 'ddu<C-r>', '|first\nsecond', '|second'],
    ['yanks and puts a line', 'yyp', '|first\nsecond', 'first\n|first\nsecond'],
  ])('%s (%s)', (_description, sequence, before, after) => {
    editor(before);
    keys(sequence);
    const { line, ch } = cm.getCursor();

    expect({ doc: cm.getValue(), cursor: { line, ch } }).toStrictEqual(parseDoc(after));
  });

  it('opens a line below, enters Insert mode, then returns to Normal mode', () => {
    editor('|parent:\n  child: old');
    keys('o');
    cm.replaceSelection('sibling: new');
    keys('<Esc>');

    expect({ doc: cm.getValue(), insertMode: cm.state.vim.insertMode }).toStrictEqual({ doc: 'parent:\nsibling: new\n  child: old', insertMode: false });
  });

  it('finds the word under the cursor and repeats the search', () => {
    editor('|alpha beta alpha beta alpha');
    keys('*');
    expect(cm.getCursor()).toMatchObject({ line: 0, ch: 11 });
    keys('n');
    expect(cm.getCursor()).toMatchObject({ line: 0, ch: 22 });
  });

  it('sorts YAML list items with an Ex command', () => {
    editor('|zeta\nalpha');
    CodeMirror.Vim.handleEx(cm, '%sort');

    expect(cm.getValue()).toStrictEqual('alpha\nzeta');
  });

  it('substitutes all matches with an Ex command', () => {
    editor('|name: old\nlabel: old');
    CodeMirror.Vim.handleEx(cm, '%s/old/new/g');

    expect(cm.getValue()).toStrictEqual('name: new\nlabel: new');
  });
});
