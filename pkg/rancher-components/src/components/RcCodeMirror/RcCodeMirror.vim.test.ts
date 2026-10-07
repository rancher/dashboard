import { shallowMount, VueWrapper } from '@vue/test-utils';
import { EditorView } from '@codemirror/view';
import { getCM, Vim } from '@replit/codemirror-vim';
import RcCodeMirror from './RcCodeMirror.vue';

type Wrapper = VueWrapper<InstanceType<typeof RcCodeMirror>>;

function parseDoc(marked: string) {
  const head = marked.indexOf('|');

  return { doc: marked.replace('|', ''), head };
}

// A representative parity set from shell/plugins/__tests__/codemirror-vim.test.ts. These are dispatched
// through the editor DOM so the component's keymap order and app shortcut interception are exercised too.
const VIM_BINDINGS: [string, string, string, string][] = [
  ['moves by word', 'w', '|alpha beta', 'alpha |beta'],
  ['moves backward by word', 'b', 'alpha |beta', '|alpha beta'],
  // The $ motion asks the view for character coordinates, which jsdom cannot provide. CM5 covers it.
  ['moves to the start of a line', '0', 'alpha |beta', '|alpha beta'],
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
];

function keyEvent(spec: string) {
  const control = spec.startsWith('<C-');
  const name = control ? spec.slice(3, -1) : spec;
  const shiftKey = !control && name !== '<Esc>' && (name !== name.toLowerCase() || name === '$');
  const key = name === '<Esc>' ? 'Escape' : name;
  const code = name === '$' ? 'Digit4' : /^[a-z]$/i.test(name) ? `Key${ name.toUpperCase() }` : key;

  return new KeyboardEvent('keydown', {
    key,
    code,
    keyCode:    name === '$' ? 52 : key === 'Escape' ? 27 : name.toUpperCase().charCodeAt(0),
    ctrlKey:    control,
    shiftKey,
    bubbles:    true,
    cancelable: true
  });
}

describe('component: RcCodeMirror Vim keymap', () => {
  let wrapper: Wrapper;

  function editor(marked: string) {
    const { doc, head } = parseDoc(marked);

    wrapper = shallowMount(RcCodeMirror, {
      props: {
        keymap: 'vim', language: 'yaml', modelValue: doc
      },
      attachTo: document.body
    }) as Wrapper;
    const view = (wrapper.vm as unknown as { view: EditorView }).view;

    view.focus();
    view.dispatch({ selection: { anchor: head } });

    return view;
  }

  function keys(view: EditorView, sequence: string) {
    sequence.match(/<[^>]+>|./g)?.forEach((key) => view.contentDOM.dispatchEvent(keyEvent(key)));
  }

  afterEach(() => wrapper?.unmount());

  it.each(VIM_BINDINGS)('%s (%s)', (_description, sequence, before, after) => {
    const view = editor(before);

    keys(view, sequence);

    const expected = parseDoc(after);

    expect({ doc: view.state.doc.toString(), head: view.state.selection.main.head }).toStrictEqual(expected);
  });

  it('opens a line, enters Insert mode, then returns to Normal mode', () => {
    const view = editor('|parent:\n  child: old');

    keys(view, 'o');
    view.dispatch({ changes: { from: view.state.selection.main.head, insert: 'sibling: new' } });
    keys(view, '<Esc>');

    expect({ doc: view.state.doc.toString(), insertMode: getCM(view)!.state.vim.insertMode }).toStrictEqual({ doc: 'parent:\nsibling: new\n  child: old', insertMode: false });
  });

  it('finds the word under the cursor and repeats the search', () => {
    const view = editor('|alpha beta alpha beta alpha');

    keys(view, '*');
    expect(view.state.selection.main.head).toStrictEqual(11);
    keys(view, 'n');
    expect(view.state.selection.main.head).toStrictEqual(22);
  });

  it.each([
    ['sorts YAML list items', '%sort', '|zeta\nalpha', 'alpha\nzeta'],
    ['substitutes all matches', '%s/old/new/g', '|name: old\nlabel: old', 'name: new\nlabel: new'],
  ])('%s with an Ex command', (_description, command, before, after) => {
    const view = editor(before);

    Vim.handleEx(getCM(view)!, command);

    expect(view.state.doc.toString()).toStrictEqual(after);
  });
});
