import 'codemirror/mode/yaml/yaml';
import 'codemirror/keymap/sublime';
import 'codemirror/addon/comment/comment';

type CM5Editor = {
  triggerOnKeyDown: (event: KeyboardEvent) => void;
  getWrapperElement: () => HTMLElement;
  getValue: () => string;
  getSelection: () => string;
  setCursor: (line: number, ch: number) => void;
  listSelections: () => { anchor: { ch: number }; head: { ch: number } }[];
  replaceRange: (text: string, position: { line: number; ch: number }) => void;
};

// CM5 has no TypeScript declarations in Dashboard's dependency tree.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CodeMirror = require('codemirror') as {
  (parent: HTMLElement, options: Record<string, unknown>): CM5Editor;
  Pos: (line: number, ch: number) => { line: number; ch: number };
};

type Modifiers = { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean };

type PlatformCase = {
  name: string;
  keyMap: string;
  mod: Modifiers;
  sortKey: string;
};

const PLATFORMS: PlatformCase[] = [
  {
    name: 'macOS', keyMap: 'macSublime', mod: { metaKey: true }, sortKey: 'F5'
  },
  {
    name: 'Windows/Linux', keyMap: 'pcSublime', mod: { ctrlKey: true }, sortKey: 'F9'
  }
];

const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  Enter:     13,
  F5:        116,
  F9:        120,
  Space:     32,
  '/':       191,
};

function press(cm: CM5Editor, key: string, modifiers: Modifiers = {}) {
  const keyCode = KEY_CODES[key] || key.toUpperCase().charCodeAt(0);

  cm.triggerOnKeyDown(new KeyboardEvent('keydown', {
    key,
    keyCode,
    bubbles:    true,
    cancelable: true,
    ...modifiers
  }));
}

describe.each(PLATFORMS)('CM5 Sublime baseline on $name', ({ keyMap, mod, sortKey }) => {
  let cm: CM5Editor;
  let getBoundingClientRect: typeof Range.prototype.getBoundingClientRect;
  let getClientRects: typeof Range.prototype.getClientRects;

  function editor(value: string): CM5Editor {
    cm = CodeMirror(document.body, {
      value, keyMap, mode: 'yaml', indentUnit: 2
    });

    return cm;
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

  afterEach(() => {
    cm?.getWrapperElement().remove();
  });

  it('selects the next occurrence', () => {
    editor('alpha alpha');
    cm.setCursor(0, 1);

    press(cm, 'd', mod);
    press(cm, 'd', mod);

    expect(cm.listSelections().map(({ anchor, head }) => [anchor.ch, head.ch])).toStrictEqual([[0, 5], [6, 11]]);
  });

  it('duplicates a line', () => {
    editor('alpha\nbeta');

    press(cm, 'd', { ...mod, shiftKey: true });

    expect(cm.getValue()).toStrictEqual('alpha\nalpha\nbeta');
  });

  it('selects a line', () => {
    editor('alpha\nbeta');

    press(cm, 'l', mod);

    expect(cm.getSelection()).toStrictEqual('alpha\n');
  });

  it('swaps a line down', () => {
    editor('alpha\nbeta');

    press(cm, 'ArrowDown', keyMap === 'macSublime' ? { ...mod, ctrlKey: true } : { ...mod, shiftKey: true });

    expect(cm.getValue()).toStrictEqual('beta\nalpha');
  });

  it('comments and uncomments a YAML line', () => {
    editor('name: app');

    press(cm, '/', mod);
    expect(cm.getValue()).toStrictEqual('# name: app');

    press(cm, '/', mod);
    expect(cm.getValue()).toStrictEqual('name: app');
  });

  it('opens an indented line below the cursor', () => {
    editor('metadata:\n  name: app');
    cm.setCursor(1, 5);

    press(cm, 'Enter', mod);

    expect(cm.getValue()).toStrictEqual('metadata:\n  name: app\n  ');
  });

  it('opens a line above the cursor', () => {
    editor('metadata:\n  name: app');
    cm.setCursor(1, 5);

    press(cm, 'Enter', { ...mod, shiftKey: true });

    expect(cm.getValue()).toStrictEqual('metadata:\n\n  name: app');
  });

  it('sorts document lines', () => {
    editor('zeta\nalpha');

    press(cm, sortKey);

    expect(cm.getValue()).toStrictEqual('alpha\nzeta');
  });

  it('deletes to a mark and yanks the deleted text', async() => {
    editor('name: app');
    cm.setCursor(0, 0);
    press(cm, 'k', mod);
    press(cm, 'Space', mod);
    // CM5 keeps a completed chord active for 50 ms while it waits for another key.
    await new Promise((resolve) => setTimeout(resolve, 60));
    cm.setCursor(0, 4);

    press(cm, 'k', mod);
    press(cm, 'w', mod);
    expect(cm.getValue()).toStrictEqual(': app');

    await new Promise((resolve) => setTimeout(resolve, 60));
    press(cm, 'k', mod);
    press(cm, 'y', mod);
    expect(cm.getValue()).toStrictEqual('name: app');
  });

  it('inherits undo and redo from the platform default map', () => {
    editor('name: app');
    cm.replaceRange('!', CodeMirror.Pos(0, 9));

    press(cm, 'z', mod);
    expect(cm.getValue()).toStrictEqual('name: app');

    press(cm, 'z', { ...mod, shiftKey: true });
    expect(cm.getValue()).toStrictEqual('name: app!');
  });
});
