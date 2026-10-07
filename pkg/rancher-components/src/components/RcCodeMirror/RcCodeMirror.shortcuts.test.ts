import type { VueWrapper } from '@vue/test-utils';
import type { EditorView } from '@codemirror/view';
import type RcCodeMirrorComponent from './RcCodeMirror.vue';
import type { RcCodeMirrorKeymap } from './types';

type Platform = 'macOS' | 'Linux' | 'Windows';
// A row limited to 'macOS' or 'other' is for a key that means something else on the other platforms
type Only = 'macOS' | 'other';

/**
 * Undo, redo and search panel shortcuts.
 * `Mod` is Cmd on macOS and Ctrl elsewhere, the same as in CodeMirror key bindings.
 */
const HISTORY_SHORTCUTS: [RcCodeMirrorKeymap, string, 'undo' | 'redo', Only?][] = [
  ['default', 'Mod-z', 'undo'],
  ['default', 'Mod-Shift-z', 'redo'],
  ['default', 'Mod-y', 'redo'],
  ['sublime', 'Mod-z', 'undo'],
  ['sublime', 'Mod-Shift-z', 'redo'],
  ['sublime', 'Mod-y', 'redo'],
  ['emacs', 'Mod-z', 'undo'],
  ['emacs', 'Mod-Shift-z', 'redo'],
  ['emacs', 'Ctrl-/', 'undo'],
  // Elsewhere Ctrl-Y is Emacs yank
  ['emacs', 'Mod-y', 'redo', 'macOS'],
];

const SEARCH_PANEL_SHORTCUTS: [RcCodeMirrorKeymap, string, Only?][] = [
  ['default', 'Mod-f'],
  ['sublime', 'Mod-f'],
  // Elsewhere Ctrl-F is Emacs forward-char
  ['emacs', 'Mod-f', 'macOS'],
  ['emacs', 'Ctrl-s'],
];

const NO_SEARCH_PANEL_SHORTCUTS: [RcCodeMirrorKeymap, string, Only?][] = [
  ['default', 'Ctrl-s'],
  ['default', 'Ctrl-r'],
  ['sublime', 'Ctrl-s'],
  ['emacs', 'Mod-f', 'other'],
  ['emacs', 'Ctrl-r'],
  ['vim', 'Mod-f'],
];

const PLATFORMS: [Platform, string][] = [
  ['macOS', 'MacIntel'],
  ['Linux', 'Linux x86_64'],
  ['Windows', 'Win32'],
];

function keyEvent(keys: string, mac: boolean): KeyboardEvent {
  const parts = keys.split('-');
  const name = parts.pop() as string;
  const mod = parts.includes('Mod');
  const shiftKey = parts.includes('Shift');

  return new KeyboardEvent('keydown', {
    key:        shiftKey ? name.toUpperCase() : name,
    code:       name === '/' ? 'Slash' : `Key${ name.toUpperCase() }`,
    // CodeMirror resolves shifted keys from the legacy keyCode, as browsers still set it
    keyCode:    name === '/' ? 191 : name.toUpperCase().charCodeAt(0),
    ctrlKey:    parts.includes('Ctrl') || (mod && !mac),
    metaKey:    mod && mac,
    shiftKey,
    bubbles:    true,
    cancelable: true
  });
}

describe.each(PLATFORMS)('component: RcCodeMirror shortcuts on %s', (platform, navigatorPlatform) => {
  const mac = platform === 'macOS';
  let shallowMount: typeof import('@vue/test-utils').shallowMount;
  let RcCodeMirror: typeof RcCodeMirrorComponent;
  let undo: typeof import('@codemirror/commands').undo;
  let wrapper: VueWrapper;

  // CodeMirror reads the platform once, when @codemirror/view loads, to decide what Mod- means and which
  // platform-specific bindings apply. jsdom reports no platform, so set one and load a fresh copy of the
  // component, and of the test utils so both use the same Vue.
  beforeAll(() => {
    Object.defineProperty(window.navigator, 'platform', { value: navigatorPlatform, configurable: true });
    jest.resetModules();
    /* eslint-disable @typescript-eslint/no-require-imports */
    ({ shallowMount } = require('@vue/test-utils'));
    RcCodeMirror = require('./RcCodeMirror.vue').default;
    ({ undo } = require('@codemirror/commands'));
    /* eslint-enable @typescript-eslint/no-require-imports */
  });

  afterAll(() => {
    Object.defineProperty(window.navigator, 'platform', { value: '', configurable: true });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const runsHere = (only?: Only) => !only || only === (mac ? 'macOS' : 'other');
  const label = (keys: string) => keys.replace('Mod', mac ? 'Cmd' : 'Ctrl');

  function mountEditor(keymap: RcCodeMirrorKeymap): EditorView {
    wrapper = shallowMount(RcCodeMirror, {
      props:    { keymap, modelValue: 'abc' },
      attachTo: document.body
    }) as VueWrapper;
    const view = (wrapper.vm as unknown as { view: EditorView }).view;

    view.focus();

    return view;
  }

  function mountYamlSublime(modelValue: string): EditorView {
    wrapper = shallowMount(RcCodeMirror, {
      props: {
        keymap: 'sublime', language: 'yaml', modelValue
      },
      attachTo: document.body
    }) as VueWrapper;
    const view = (wrapper.vm as unknown as { view: EditorView }).view;

    view.focus();

    return view;
  }

  it.each(HISTORY_SHORTCUTS
    .filter(([, , , only]) => runsHere(only))
    .map(([keymap, keys, action]) => [keymap, action, label(keys), keys] as const)
  )('%s keymap: %s with %s', (keymap, action, _label, keys) => {
    const view = mountEditor(keymap);

    view.dispatch({ changes: { from: 3, insert: '!' } });

    if (action === 'redo') {
      undo(view);
    }

    view.contentDOM.dispatchEvent(keyEvent(keys, mac));

    expect(view.state.doc.toString()).toStrictEqual(action === 'undo' ? 'abc' : 'abc!');
  });

  it.each(SEARCH_PANEL_SHORTCUTS
    .filter(([, , only]) => runsHere(only))
    .map(([keymap, keys]) => [keymap, label(keys), keys] as const)
  )('%s keymap: opens the search panel with %s', (keymap, _label, keys) => {
    const view = mountEditor(keymap);

    view.contentDOM.dispatchEvent(keyEvent(keys, mac));

    expect(wrapper.find('.cm-search').exists()).toBe(true);
  });

  it.each(SEARCH_PANEL_SHORTCUTS
    .filter(([, , only]) => runsHere(only))
    .map(([keymap, keys]) => [keymap, label(keys), keys] as const)
  )('%s keymap: toggles the search panel with %s', (keymap, _label, keys) => {
    const view = mountEditor(keymap);

    view.contentDOM.dispatchEvent(keyEvent(keys, mac));
    const field = wrapper.find<HTMLInputElement>('.cm-search input[name=search]').element;

    field.focus();
    const closeEvent = keyEvent(keys, mac);

    field.dispatchEvent(closeEvent);
    expect({ open: wrapper.find('.cm-search').exists(), defaultPrevented: closeEvent.defaultPrevented }).toStrictEqual({ open: false, defaultPrevented: true });

    view.contentDOM.dispatchEvent(keyEvent(keys, mac));
    expect(wrapper.find('.cm-search').exists()).toBe(true);
  });

  it.each(NO_SEARCH_PANEL_SHORTCUTS
    .filter(([, , only]) => runsHere(only))
    .map(([keymap, keys]) => [keymap, label(keys), keys] as const)
  )('%s keymap: does not open search panel with %s', (keymap, _label, keys) => {
    const view = mountEditor(keymap);

    view.contentDOM.dispatchEvent(keyEvent(keys, mac));

    expect(wrapper.find('.cm-search').exists()).toBe(false);
  });

  it('sublime keymap: selects the next occurrence with Mod-D', () => {
    const view = mountEditor('sublime');

    view.dispatch({
      changes: {
        from: 0, to: view.state.doc.length, insert: 'alpha alpha'
      }
    });
    view.dispatch({ selection: { anchor: 1 } });
    view.contentDOM.dispatchEvent(keyEvent('Mod-d', mac));
    view.contentDOM.dispatchEvent(keyEvent('Mod-d', mac));

    expect(view.state.selection.ranges.map(({ from, to }) => [from, to])).toStrictEqual([[0, 5], [6, 11]]);
  });

  it('sublime keymap: duplicates the line with Mod-Shift-D', () => {
    const view = mountEditor('sublime');

    view.dispatch({
      changes: {
        from: 0, to: view.state.doc.length, insert: 'alpha\nbeta'
      }
    });
    view.contentDOM.dispatchEvent(keyEvent('Mod-Shift-d', mac));

    expect(view.state.doc.toString()).toStrictEqual('alpha\nalpha\nbeta');
  });

  it('sublime keymap: selects the line with Mod-L', () => {
    const view = mountEditor('sublime');

    view.dispatch({
      changes: {
        from: 0, to: view.state.doc.length, insert: 'alpha\nbeta'
      }
    });
    view.contentDOM.dispatchEvent(keyEvent('Mod-l', mac));

    expect(view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to)).toStrictEqual('alpha\n');
  });

  it('sublime keymap: toggles a YAML line comment with Mod-/', () => {
    const view = mountYamlSublime('name: app');

    view.contentDOM.dispatchEvent(keyEvent('Mod-/', mac));
    expect(view.state.doc.toString()).toStrictEqual('# name: app');

    view.contentDOM.dispatchEvent(keyEvent('Mod-/', mac));
    expect(view.state.doc.toString()).toStrictEqual('name: app');
  });

  it('sublime keymap: decreases indentation with Shift-Tab', () => {
    const view = mountYamlSublime('  name: app');

    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', code: 'Tab', keyCode: 9, shiftKey: true, bubbles: true, cancelable: true
    }));

    expect(view.state.doc.toString()).toStrictEqual('name: app');
  });

  it('sublime keymap: deletes one indentation unit with Backspace', () => {
    const view = mountYamlSublime('    name: app');

    view.dispatch({ selection: { anchor: 4 } });
    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Backspace', code: 'Backspace', keyCode: 8, bubbles: true, cancelable: true
    }));

    expect(view.state.doc.toString()).toStrictEqual('  name: app');
  });

  it('sublime keymap: opens an indented line below with Mod-Enter', () => {
    const view = mountYamlSublime('metadata:\n  name: app');

    view.dispatch({ selection: { anchor: 15 } });
    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, ctrlKey: !mac, metaKey: mac, bubbles: true, cancelable: true
    }));

    expect(view.state.doc.toString()).toStrictEqual('metadata:\n  name: app\n  ');
  });

  if (mac) {
    it('sublime keymap: swaps lines with Ctrl-Cmd-Down', () => {
      const view = mountEditor('sublime');

      view.dispatch({
        changes: {
          from: 0, to: view.state.doc.length, insert: 'alpha\nbeta'
        }
      });
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, ctrlKey: true, metaKey: true, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.toString()).toStrictEqual('beta\nalpha');
    });
  } else {
    it('sublime keymap: swaps lines with Shift-Ctrl-Down', () => {
      const view = mountEditor('sublime');

      view.dispatch({
        changes: {
          from: 0, to: view.state.doc.length, insert: 'alpha\nbeta'
        }
      });
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true
      }));

      expect(view.state.doc.toString()).toStrictEqual('beta\nalpha');
    });
  }
});

// These worked in Dashboard's CM5 Sublime editor but do not have an equivalent binding in RcCodeMirror yet.
// The CM5 search, replace, and hard-wrap commands whose addons Dashboard did not load are excluded.
describe('CM5 Sublime bindings pending parity', () => {
  it.todo('Ctrl-Left/Right on Mac and Alt-Left/Right elsewhere move by subword, not syntax node');
  it.todo('Ctrl-Alt-Up/Down on Mac and Ctrl-Up/Down elsewhere scroll by one line');
  it.todo('Shift-Mod-L splits a multiline selection into one cursor per line');
  it.todo('Shift-Mod-Space selects scope; Shift-Mod-M selects between brackets; Mod-M jumps to a bracket');
  it.todo('Shift-Ctrl-K deletes a line on Mac and Ctrl-T transposes characters elsewhere');
  it.todo('Shift-Mod-Enter inserts a line above the cursor');
  it.todo('Shift-Ctrl-Up/Down adds a cursor on Mac as Ctrl-Alt-Up/Down does elsewhere');
  it.todo('Mod-J joins lines');
  it.todo('F5/F9 and their Shift and Mod variants sort lines in both directions and case modes');
  it.todo('F2, Shift-F2, Mod-F2, Shift-Mod-F2, and Alt-F2 navigate and select bookmarks');
  it.todo('Mod-K then D skips an occurrence, K deletes to line end, and Backspace deletes to line start');
  it.todo('Mod-K then U/L changes case, Space/A/W/X/Y manipulates the mark, and C centers the cursor');
  it.todo('Mod-K then 1/0/J folds or unfolds all, and Shift-Mod-[ or ] folds or unfolds at the cursor');
  it.todo('Mod-F3, Shift-Mod-F3, and Alt-F3 find or select occurrences under the cursor');
  it.todo('Ctrl-Up/Down on Mac moves to document start/end');
});
