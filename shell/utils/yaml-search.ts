/**
 * Helpers for searching a YAML document shown in a CodeMirror 6 editor (see
 * YamlOverridesEditor.vue). Matching works like a browser's find in page: a plain,
 * case-insensitive substring match, so "bar" also matches "fooBar".
 */
import { EditorSelection, RangeSetBuilder, StateEffect } from '@codemirror/state';
import type { EditorState, Extension } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import {
  SearchQuery, findNext, findPrevious, getSearchQuery, search, setSearchQuery
} from '@codemirror/search';

/** The search only runs once the query has at least this many characters. */
export const MIN_SEARCH_LENGTH = 3;

/** How many matches the query has, and the position of the selected one. */
export interface YamlSearchMatches {
  /** The position of the selected match, from 1, or 0 when the selection isn't on a match. */
  current: number;
  total: number;
}

const NO_MATCHES: YamlSearchMatches = { current: 0, total: 0 };

const matchMark = Decoration.mark({ class: 'cm-searchMatch' });
const selectedMatchMark = Decoration.mark({ class: 'cm-searchMatch cm-searchMatch-selected' });

/**
 * Marks the matches of the query with the classes and colours of CodeMirror's own
 * search. CodeMirror only does this while its search panel is open, and we use our
 * own search box instead. Only the visible part of the document is marked.
 */
const searchMatchHighlight = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.build(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.selectionSet || update.viewportChanged || getSearchQuery(update.startState) !== getSearchQuery(update.state)) {
      this.decorations = this.build(update.view);
    }
  }

  build(view: EditorView): DecorationSet {
    const query = getSearchQuery(view.state);

    if (!query.valid) {
      return Decoration.none;
    }

    const { from: selectedFrom, to: selectedTo } = view.state.selection.main;
    const builder = new RangeSetBuilder<Decoration>();

    view.visibleRanges.forEach(({ from, to }) => {
      const cursor = query.getCursor(view.state, from, to);

      for (let match = cursor.next(); !match.done; match = cursor.next()) {
        const selected = match.value.from === selectedFrom && match.value.to === selectedTo;

        builder.add(match.value.from, match.value.to, selected ? selectedMatchMark : matchMark);
      }
    });

    return builder.finish();
  }
}, { decorations: (plugin) => plugin.decorations });

const yamlSearchExtension: Extension = [
  searchMatchHighlight,
  // Center the match, so the lines around it show too, not just the match at an edge
  search({ scrollToMatch: (range) => EditorView.scrollIntoView(range, { y: 'center' }) }),
];

/**
 * Highlight the matches of `query` (case-insensitive). It is also the query that
 * `findYamlSearchMatch` moves between. Pass an empty query to clear it. The
 * extension is only added to an editor the first time it's used.
 */
export function setYamlSearch(view: EditorView, query = '') {
  const next = new SearchQuery({ search: query, literal: true });

  if (!view.plugin(searchMatchHighlight)) {
    view.dispatch({ effects: StateEffect.appendConfig.of(yamlSearchExtension) });
  }

  if (!getSearchQuery(view.state).eq(next)) {
    view.dispatch({ effects: setSearchQuery.of(next) });
  }
}

/** Count the matches of the query set by `setYamlSearch` and find the selected one. */
export function yamlSearchMatches(state: EditorState): YamlSearchMatches {
  const query = getSearchQuery(state);

  if (!query.valid) {
    return NO_MATCHES;
  }

  const { from, to } = state.selection.main;
  const cursor = query.getCursor(state);
  let current = 0;
  let total = 0;

  for (let match = cursor.next(); !match.done; match = cursor.next()) {
    total++;

    if (match.value.from === from && match.value.to === to) {
      current = total;
    }
  }

  return { current, total };
}

/**
 * Select the first, next or previous match of the query set by `setYamlSearch`
 * and scroll it into view. Next and previous wrap around, like a browser.
 */
export function findYamlSearchMatch(view: EditorView, direction: 'first' | 'next' | 'previous'): YamlSearchMatches {
  const query = getSearchQuery(view.state);

  if (!query.valid) {
    return NO_MATCHES;
  }

  if (direction === 'first') {
    const first = query.getCursor(view.state).next();

    if (first.done) {
      return NO_MATCHES;
    }

    const { from, to } = first.value;

    view.dispatch({
      selection: EditorSelection.single(from, to),
      effects:   EditorView.scrollIntoView(EditorSelection.range(from, to), { y: 'center' }),
      userEvent: 'select.search',
    });
  } else if (direction === 'next') {
    findNext(view);
  } else {
    findPrevious(view);
  }

  return yamlSearchMatches(view.state);
}
