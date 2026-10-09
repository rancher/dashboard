import { EditorState, Prec, StateEffect } from '@codemirror/state';
import { keymap, panels } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import { openSearchPanel, searchKeymap, searchPanelOpen } from '@codemirror/search';
import { getCM } from '@replit/codemirror-vim';
import { searchPanel } from '@components/RcCodeMirror';

// The panel's keys, which the editor leaves out in Vim mode
const PANEL_KEYS = ['F3', 'Mod-g', 'Escape'];

export interface SearchPanelOptions {
  /** The search field's placeholder, instead of "Find" */
  placeholder?: string;
  /** Where to put the panel instead of the top of the editor */
  container?: HTMLElement | null;
}

/**
 * Open CodeMirror's search panel and keep it open like a search box. Mod-F focuses it
 * and Escape goes back to the editor.
 */
export function keepSearchPanelOpen(view: EditorView, { placeholder, container }: SearchPanelOptions = {}) {
  const keepOpen = EditorState.transactionFilter.of((tr) => {
    return tr.effects.length && searchPanelOpen(tr.startState) && !searchPanelOpen(tr.state) ? [] : tr;
  });

  // Mod-F would otherwise toggle the panel, which can't close now. Vim keeps Ctrl-F to scroll.
  const keys = Prec.highest(keymap.of([
    { key: 'Mod-f', run: () => !getCM(view) && openSearchPanel(view) },
    {
      key: 'Mod-f', run: openSearchPanel, scope: 'search-panel'
    },
    ...searchKeymap.filter(({ key }) => key && PANEL_KEYS.includes(key)).map((binding) => ({ ...binding, scope: 'search-panel' })),
  ]));

  // The first phrase found wins, so this goes before the editor's own translations
  const fieldName = placeholder ? Prec.highest(EditorState.phrases.of({ Find: placeholder })) : [];

  const place = container ? panels({ topContainer: container }) : [];

  // RcCodeMirror's panel, which the editor leaves out in Vim mode
  view.dispatch({ effects: StateEffect.appendConfig.of([searchPanel, keepOpen, keys, fieldName, place]) });

  const focused = view.root.activeElement as HTMLElement | null;

  openSearchPanel(view);

  // The panel focuses its field when it opens, so put the focus back
  if (view.root.activeElement !== focused) {
    (view.root.activeElement as HTMLElement | null)?.blur();
    focused?.focus({ preventScroll: true });
  }
}
