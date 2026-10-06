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
  ['emacs', 'Mod-z', 'undo'],
  ['emacs', 'Mod-Shift-z', 'redo'],
  ['emacs', 'Ctrl-/', 'undo'],
  // Elsewhere Ctrl-Y is Emacs yank
  ['emacs', 'Mod-y', 'redo', 'macOS'],
];

const SEARCH_PANEL_SHORTCUTS: [RcCodeMirrorKeymap, string, Only?][] = [
  ['default', 'Mod-f'],
  // Elsewhere Ctrl-F is Emacs forward-char
  ['emacs', 'Mod-f', 'macOS'],
  ['emacs', 'Ctrl-s'],
];

const NO_SEARCH_PANEL_SHORTCUTS: [RcCodeMirrorKeymap, string, Only?][] = [
  ['default', 'Ctrl-s'],
  ['default', 'Ctrl-r'],
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
});
