import { EditorState, Prec, StateEffect } from '@codemirror/state';
import { keymap, panels } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import { openSearchPanel, searchPanelOpen } from '@codemirror/search';

export interface SearchPanelOptions {
  /** The placeholder and accessible name of the search field, instead of "Find". */
  placeholder?: string;
  /**
   * Where to put the panel instead of the top of the editor, e.g. above the editor's
   * frame like a search box. It keeps the editor's theme. This needs a search panel at
   * the top, like RcCodeMirror's.
   */
  container?: HTMLElement | null;
}

/**
 * Open CodeMirror's search panel and keep it open, so the search is always in view
 * like a search box. Nothing closes it: Mod-F moves the focus to it rather than
 * closing it, and Escape in it goes back to the editor. Opening it doesn't take the
 * focus from where it is, e.g. the button that showed the editor.
 */
export function keepSearchPanelOpen(view: EditorView, { placeholder, container }: SearchPanelOptions = {}) {
  const keepOpen = EditorState.transactionFilter.of((tr) => {
    return tr.effects.length && searchPanelOpen(tr.startState) && !searchPanelOpen(tr.state) ? [] : tr;
  });

  // Mod-F would otherwise toggle the panel, which can't close now
  const findKey = Prec.highest(keymap.of([{
    key: 'Mod-f', run: openSearchPanel, scope: 'editor search-panel'
  }]));

  // The panel names its field with the "Find" phrase. The first phrase found wins, so
  // this one goes before the editor's own translations.
  const fieldName = placeholder ? Prec.highest(EditorState.phrases.of({ Find: placeholder })) : [];

  const place = container ? panels({ topContainer: container }) : [];

  view.dispatch({ effects: StateEffect.appendConfig.of([keepOpen, findKey, fieldName, place]) });

  const focused = view.root.activeElement as HTMLElement | null;

  openSearchPanel(view);

  // The panel focuses its field when it opens, so put the focus back
  if (view.root.activeElement !== focused) {
    (view.root.activeElement as HTMLElement | null)?.blur();
    focused?.focus({ preventScroll: true });
  }
}
