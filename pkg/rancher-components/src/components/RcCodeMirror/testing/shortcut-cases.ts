import { shallowMount, VueWrapper } from '@vue/test-utils';
import { EditorView } from '@codemirror/view';
import { undo } from '@codemirror/commands';
import type RcCodeMirrorComponent from '../RcCodeMirror.vue';
import type { RcCodeMirrorKeymap } from '../types';

export type Platform = 'macos' | 'linux' | 'windows';

/**
 * Undo, redo and search shortcuts across keymaps and platforms, matching the CodeMirror 5 editor. `Mod` is
 * Cmd on macOS and Ctrl elsewhere, the same as in CodeMirror key bindings.
 */
type ShortcutCase = {
  keymap: RcCodeMirrorKeymap;
  keys: string;
  action: 'undo' | 'redo' | 'search';
  // Only run on macOS or only elsewhere, for keys that mean something else on the other
  platform?: 'macos' | 'other';
};

const SHORTCUT_CASES: ShortcutCase[] = [
  {
    keymap: 'default', keys: 'Mod-z', action: 'undo'
  },
  {
    keymap: 'default', keys: 'Mod-Shift-z', action: 'redo'
  },
  {
    keymap: 'default', keys: 'Mod-y', action: 'redo'
  },
  {
    keymap: 'default', keys: 'Mod-f', action: 'search'
  },
  {
    keymap: 'emacs', keys: 'Mod-z', action: 'undo'
  },
  {
    keymap: 'emacs', keys: 'Mod-Shift-z', action: 'redo'
  },
  {
    keymap: 'emacs', keys: 'Ctrl-/', action: 'undo'
  },
  // Elsewhere Ctrl-Y is Emacs yank
  {
    keymap: 'emacs', keys: 'Mod-y', action: 'redo', platform: 'macos'
  },
  // Elsewhere Ctrl-F is Emacs forward-char, and Ctrl-S searches
  {
    keymap: 'emacs', keys: 'Mod-f', action: 'search', platform: 'macos'
  },
  {
    keymap: 'emacs', keys: 'Ctrl-s', action: 'search', platform: 'other'
  },
];

const ACTION_LABELS = {
  undo: 'undoes', redo: 'redoes', search: 'opens search'
};

function keyEvent(keys: string, macos: boolean): KeyboardEvent {
  const parts = keys.split('-');
  const name = parts.pop() as string;
  const mod = parts.includes('Mod');
  const shiftKey = parts.includes('Shift');
  const code = name === '/' ? 'Slash' : `Key${ name.toUpperCase() }`;
  // CodeMirror resolves shifted keys from the legacy keyCode, as browsers still set it
  const keyCode = name === '/' ? 191 : name.toUpperCase().charCodeAt(0);

  return new KeyboardEvent('keydown', {
    key:        shiftKey ? name.toUpperCase() : name,
    code,
    keyCode,
    ctrlKey:    parts.includes('Ctrl') || (mod && !macos),
    metaKey:    mod && macos,
    shiftKey,
    bubbles:    true,
    cancelable: true
  });
}

/**
 * Registers the shortcut tests for the platform CodeMirror loaded with. `RcCodeMirror` must be imported by
 * the calling test file, after anything that sets the platform.
 */
export function describeShortcuts(RcCodeMirror: typeof RcCodeMirrorComponent, platform: Platform): void {
  const macos = platform === 'macos';
  const cases = SHORTCUT_CASES
    .filter((c) => !c.platform || c.platform === (macos ? 'macos' : 'other'))
    .map((c) => [c.keymap, ACTION_LABELS[c.action], c.keys.replace('Mod', macos ? 'Cmd' : 'Ctrl'), c] as const);

  describe(`undo, redo and search shortcuts on ${ platform }`, () => {
    let wrapper: VueWrapper;

    afterEach(() => {
      wrapper?.unmount();
    });

    it.each(cases)('%s keymap: %s with %s', (keymap, _action, _keys, { action, keys }) => {
      wrapper = shallowMount(RcCodeMirror, {
        props:    { keymap, modelValue: 'abc' },
        attachTo: document.body
      }) as VueWrapper;
      const view = (wrapper.vm as unknown as { view: EditorView }).view;

      view.focus();

      if (action === 'search') {
        view.contentDOM.dispatchEvent(keyEvent(keys, macos));

        expect(wrapper.find('.cm-search').exists()).toBe(true);

        return;
      }

      view.dispatch({ changes: { from: 3, insert: '!' } });

      if (action === 'redo') {
        undo(view);
      }

      view.contentDOM.dispatchEvent(keyEvent(keys, macos));

      expect(view.state.doc.toString()).toStrictEqual(action === 'undo' ? 'abc' : 'abc!');
    });
  });
}
