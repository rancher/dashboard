import { shallowMount, VueWrapper } from '@vue/test-utils';
import { EditorView } from '@codemirror/view';
import RcCodeMirror from './RcCodeMirror.vue';

type Wrapper = VueWrapper<InstanceType<typeof RcCodeMirror>>;

/**
 * The Emacs bindings RcCodeMirror keeps from the CodeMirror 5 editor it replaced. Each row presses a key
 * sequence in a YAML editor and checks the document and selection afterwards, so a change to the vendored
 * Emacs keymap, to the keymap order or to an extension that claims a key first shows up here.
 *
 * Documents mark the cursor (selection head) with `|` and, when text is selected, the anchor with `^`.
 * Key sequences are written Emacs style, separated by spaces: `C-` is Ctrl, `M-` is Alt, `S-` is Shift.
 *
 * Line and page movement (C-n, C-p, C-v, M-v) need layout, which jsdom does not have. The Cypress editor
 * shortcut tests cover C-p in a browser. C-n is bound, but Chrome and Firefox keep it for a new window, so
 * it never reaches the editor.
 */
const EMACS_BINDINGS: [string, string, string, string][] = [
  // Movement
  ['moves forward a character', 'C-f', 'a|bc', 'ab|c'],
  ['moves backward a character', 'C-b', 'ab|c', 'a|bc'],
  ['moves forward a word', 'M-f', 'foo |bar baz', 'foo bar| baz'],
  ['moves backward a word', 'M-b', 'foo bar| baz', 'foo |bar baz'],
  ['moves to the start of the line', 'C-a', 'top:\n  chi|ld', 'top:\n|  child'],
  ['moves to the end of the line', 'C-e', 'top:\n  chi|ld', 'top:\n  child|'],
  ['moves to the start of the document', 'M-S-,', 'top:\n  chi|ld', '|top:\n  child'],
  ['moves to the end of the document', 'M-S-.', 'to|p:\n  child', 'top:\n  child|'],
  ['repeats a command four times after C-u', 'C-u C-f', '|abcdef', 'abcd|ef'],
  ['repeats a command a given count after C-u', 'C-u 2 C-f', '|abcdef', 'ab|cdef'],
  ['moves to the next paragraph', 'C-Down', 'first| line\nnext line\n\nlast', 'first line\nnext line\n|\nlast'],
  ['moves to the previous paragraph', 'C-Up', 'first\n\nnext| line', 'first\n|\nnext line'],

  // Deletion, killing and yanking
  ['deletes the next character', 'C-d', 'a|bc', 'a|c'],
  ['deletes the previous character', 'C-h', 'ab|c', 'a|c'],
  ['kills to the end of the line', 'C-k', 'top: |value\nnext', 'top: |\nnext'],
  ['kills the line break at the end of a line', 'C-k', 'top:|\nnext', 'top:|next'],
  ['yanks the last kill', 'C-k C-a C-y', 'foo |bar', 'bar|foo '],
  ['kills the next word', 'M-d', 'foo |bar baz', 'foo | baz'],
  ['kills the previous word', 'M-Backspace', 'foo bar| baz', 'foo | baz'],
  ['kills the region', 'C-Space C-f C-f C-w', 'a|bcd', 'a|d'],
  ['copies the region without killing it', 'C-Space C-f C-f M-w C-e C-y', 'a|bcd', 'abcdbc|'],

  // Mark
  ['extends the selection from the mark', 'C-Space C-f C-f', 'a|bcd', 'a^bc|d'],
  ['exchanges point and mark', 'C-Space C-f C-f C-x C-x', 'a|bcd', 'a|bc^d'],
  ['clears the mark with C-g', 'C-Space C-f C-g', 'a|bc', 'ab|c'],
  ['selects the document', 'C-x h', 'top:\n  chi|ld', '^top:\n  child|'],

  // Editing
  ['opens a line', 'C-o', 'ab|cd', 'ab|\ncd'],
  ['transposes characters', 'C-t', 'ab|c', 'acb|'],
  ['upcases a word', 'M-u', 'foo |bar baz', 'foo BAR| baz'],
  ['downcases a word', 'M-l', 'foo |BAR baz', 'foo bar| baz'],
  ['capitalizes a word', 'M-c', 'foo |bAR baz', 'foo Bar| baz'],
  ['collapses whitespace to one space', 'M-Space', 'foo  |  bar', 'foo |bar'],
  ['toggles a line comment', 'M-;', 'foo: |bar', '# foo: |bar'],
  ['keeps the indentation of a new line', 'Return', 'top:\n  child: value|', 'top:\n  child: value\n  |'],
  ['reindents text after the cursor when inserting a new line', 'Return', '  delta:| value', '  delta:\n  |value'],
  ['inserts a line break without indentation', 'C-j', '  delta:| value', '  delta:\n| value'],
  ['indents a line with Tab', 'Tab', 'foo:| bar', '  foo:| bar'],
  ['unindents a line with Shift-Tab', 'S-Tab', '  foo:| bar', 'foo:| bar'],

  // Undo and redo
  ['undoes with C-/', 'C-d C-/', 'a|bc', 'a|bc'],
  ['undoes with C-z', 'C-d C-z', 'a|bc', 'a|bc'],
  ['undoes with C-x u', 'C-d C-x u', 'a|bc', 'a|bc'],
  ['redoes with C-S-z', 'C-d C-/ C-S-z', 'a|bc', 'a|c'],
];

const NAMED_KEYS: Record<string, [string, string]> = {
  Space:     [' ', 'Space'],
  Return:    ['Enter', 'Enter'],
  Backspace: ['Backspace', 'Backspace'],
  Tab:       ['Tab', 'Tab'],
  Down:      ['ArrowDown', 'ArrowDown'],
  Up:        ['ArrowUp', 'ArrowUp'],
  ',':       [',', 'Comma'],
  '.':       ['.', 'Period'],
  ';':       [';', 'Semicolon'],
  '/':       ['/', 'Slash'],
};

const SHIFTED_KEYS: Record<string, string> = {
  ',': '<', '.': '>', '/': '?'
};

function keyEvent(spec: string): KeyboardEvent {
  const parts = spec.split(/-(?=.)/);
  const name = parts.pop() as string;
  const shiftKey = parts.includes('S');
  let key: string;
  let code: string;

  if (NAMED_KEYS[name]) {
    [key, code] = NAMED_KEYS[name];
  } else if (/^\d$/.test(name)) {
    [key, code] = [name, `Digit${ name }`];
  } else {
    [key, code] = [name, `Key${ name.toUpperCase() }`];
  }

  if (shiftKey) {
    key = SHIFTED_KEYS[key] || key.toUpperCase();
  }

  return new KeyboardEvent('keydown', {
    key,
    code,
    ctrlKey:    parts.includes('C'),
    altKey:     parts.includes('M'),
    shiftKey,
    bubbles:    true,
    cancelable: true
  });
}

function parseDoc(marked: string): { doc: string, anchor: number, head: number } {
  const doc = marked.replace(/[|^]/g, '');
  const head = marked.replace(/\^/g, '').indexOf('|');
  const anchorMarker = marked.replace(/\|/g, '').indexOf('^');

  return {
    doc, head, anchor: anchorMarker === -1 ? head : anchorMarker
  };
}

describe('component: RcCodeMirror emacs keymap', () => {
  let wrapper: Wrapper;

  beforeAll(() => {
    // M-w copies to the system clipboard as well as the kill ring, and jsdom has no clipboard
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: jest.fn().mockResolvedValue(undefined) }, configurable: true });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it.each(EMACS_BINDINGS)('%s (%s)', (_description, keys, before, after) => {
    const start = parseDoc(before);

    wrapper = shallowMount(RcCodeMirror, {
      props: {
        keymap: 'emacs', language: 'yaml', modelValue: start.doc
      },
      attachTo: document.body
    }) as Wrapper;
    const view = (wrapper.vm as unknown as { view: EditorView }).view;

    view.focus();
    view.dispatch({ selection: { anchor: start.anchor, head: start.head } });
    keys.split(' ').forEach((spec) => view.contentDOM.dispatchEvent(keyEvent(spec)));

    const expected = parseDoc(after);
    const { anchor, head } = view.state.selection.main;

    expect({
      doc: view.state.doc.toString(), anchor, head
    }).toStrictEqual(expected);
  });

  it.each(['C-s', 'C-r'])('does not open a search panel with %s', (keys) => {
    wrapper = shallowMount(RcCodeMirror, {
      props:    { keymap: 'emacs', modelValue: 'find me' },
      attachTo: document.body
    }) as Wrapper;
    const view = (wrapper.vm as unknown as { view: EditorView }).view;

    view.focus();
    view.contentDOM.dispatchEvent(keyEvent(keys));

    expect(wrapper.find('.cm-search').exists()).toBe(false);
  });

  it.each(['Return', 'C-j', 'Tab', 'S-Tab', 'M-c', 'M-Space'])(
    'does not edit a read only document with %s', (keys) => {
      wrapper = shallowMount(RcCodeMirror, {
        props: {
          keymap: 'emacs', language: 'yaml', modelValue: '  foo:   bAR', readOnly: true
        },
        attachTo: document.body
      }) as Wrapper;
      const view = (wrapper.vm as unknown as { view: EditorView }).view;

      view.focus();
      view.dispatch({ selection: { anchor: 9 } });
      view.contentDOM.dispatchEvent(keyEvent(keys));

      expect(view.state.doc.toString()).toStrictEqual('  foo:   bAR');
    }
  );

  it('allows Tab to move focus after Escape', () => {
    wrapper = shallowMount(RcCodeMirror, {
      props:    { keymap: 'emacs', modelValue: 'foo' },
      attachTo: document.body
    }) as Wrapper;
    const view = (wrapper.vm as unknown as { view: EditorView }).view;

    view.focus();
    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true
    }));
    const tab = new KeyboardEvent('keydown', {
      key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true
    });

    view.contentDOM.dispatchEvent(tab);

    expect(tab.defaultPrevented).toBe(false);
    expect(view.state.doc.toString()).toStrictEqual('foo');
  });

  it.each(['Tab', 'S-Tab'])('lets %s leave the input variant', (keys) => {
    wrapper = shallowMount(RcCodeMirror, {
      props: {
        keymap: 'emacs', variant: 'input', modelValue: 'foo'
      },
      attachTo: document.body
    }) as Wrapper;
    const view = (wrapper.vm as unknown as { view: EditorView }).view;

    view.focus();
    const event = keyEvent(keys);

    view.contentDOM.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(view.state.doc.toString()).toStrictEqual('foo');
  });

  it.each([
    ['Cmd-F', {
      key: 'f', code: 'KeyF', metaKey: true
    }],
    ['Cmd-/', {
      key: '/', code: 'Slash', metaKey: true
    }],
    ['Alt-Up', {
      key: 'ArrowUp', code: 'ArrowUp', altKey: true
    }]
  ])('does not run the default %s shortcut', (_description, key) => {
    wrapper = shallowMount(RcCodeMirror, {
      props: {
        keymap: 'emacs', language: 'yaml', modelValue: 'foo: bar\nnext: value'
      },
      attachTo: document.body
    }) as Wrapper;
    const view = (wrapper.vm as unknown as { view: EditorView }).view;

    view.focus();
    view.dispatch({ selection: { anchor: 5 } });
    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
      ...key, bubbles: true, cancelable: true
    }));

    expect({ doc: view.state.doc.toString(), search: wrapper.find('.cm-search').exists() }).toStrictEqual({ doc: 'foo: bar\nnext: value', search: false });
  });

  // CodeMirror 5 Emacs bindings RcCodeMirror does not have yet. Moving one into EMACS_BINDINGS once it works
  // keeps it from regressing.
  describe('bindings missing since CodeMirror 5', () => {
    it.todo('M-a and M-e move by sentence');
    it.todo('M-k kills a sentence and C-x Delete kills back to its start');
    it.todo('M-{ and M-} move by paragraph');
    it.todo('C-M-f, C-M-b, C-M-k, C-M-Backspace, C-M-t, C-M-u and C-M-S-2 act on balanced expressions');
    it.todo('M-Left and M-Right move by word (they move by syntax node instead)');
    it.todo('C-S-2 sets the mark');
    it.todo('C-x Tab indents rigidly and C-q Tab inserts a tab');
    it.todo('M-/ completes words from the document');
  });
});
