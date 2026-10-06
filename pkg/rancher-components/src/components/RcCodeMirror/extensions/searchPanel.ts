import {
  SearchQuery, closeSearchPanel, findNext, findPrevious, getSearchQuery, setSearchQuery
} from '@codemirror/search';
import type { EditorView, Panel, ViewUpdate } from '@codemirror/view';
import { runScopeHandlers } from '@codemirror/view';

function iconButton(view: EditorView, name: string, icon: string, label: string, action: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  const glyph = document.createElement('i');

  button.type = 'button';
  button.name = name;
  button.setAttribute('aria-label', view.state.phrase(label));
  button.title = view.state.phrase(label);
  glyph.className = `icon ${ icon }`;
  glyph.setAttribute('aria-hidden', 'true');
  button.appendChild(glyph);
  button.addEventListener('click', action);

  return button;
}

export function createSearchPanel(view: EditorView): Panel {
  const dom = document.createElement('div');
  const fieldWrap = document.createElement('div');
  const field = document.createElement('input');
  const controls = document.createElement('div');
  const count = document.createElement('span');
  const searchIcon = document.createElement('i');
  let query = getSearchQuery(view.state);

  dom.className = 'cm-search';
  fieldWrap.className = 'cm-search-field';
  field.className = 'cm-textfield';
  field.name = 'search';
  field.value = query.search;
  field.placeholder = view.state.phrase('Find');
  field.setAttribute('aria-label', view.state.phrase('Find'));
  field.setAttribute('main-field', 'true');
  field.setAttribute('autocomplete', 'off');
  field.setAttribute('spellcheck', 'false');

  controls.className = 'cm-search-controls';
  count.className = 'cm-search-count';
  count.setAttribute('role', 'status');
  count.setAttribute('aria-live', 'polite');
  searchIcon.className = 'icon icon-search cm-search-icon';
  searchIcon.setAttribute('aria-hidden', 'true');

  const clear = document.createElement('button');

  clear.type = 'button';
  clear.name = 'clear';
  clear.className = 'role-tertiary';
  clear.textContent = view.state.phrase('Clear');
  clear.setAttribute('aria-label', view.state.phrase('Clear search'));
  clear.addEventListener('click', () => {
    field.value = '';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.focus();
  });
  const next = iconButton(view, 'next', 'icon-chevron-down', 'next', () => findNext(view));
  const previous = iconButton(view, 'prev', 'icon-chevron-up', 'previous', () => findPrevious(view));
  const close = iconButton(view, 'close', 'icon-close', 'close', () => closeSearchPanel(view));

  controls.append(next, count, previous, clear, searchIcon);
  fieldWrap.append(field, controls);
  dom.append(fieldWrap, close);

  function updateCount(): void {
    const state = view.state;
    const selected = state.selection.main;
    let total = 0;
    let current = 0;

    if (query.valid) {
      const cursor = query.getCursor(state);

      for (let match = cursor.next(); !match.done; match = cursor.next()) {
        total++;
        if (match.value.from === selected.from && match.value.to === selected.to) {
          current = total;
        }
      }
    }

    count.textContent = query.search ? state.phrase('$1 of $2', current, total) : '';
    count.hidden = !query.search;
    clear.hidden = !query.search;
    clear.style.display = query.search ? '' : 'none';
    searchIcon.hidden = !!query.search;
    searchIcon.style.display = query.search ? 'none' : '';
    next.disabled = total === 0;
    previous.disabled = total === 0;
  }

  field.addEventListener('input', () => {
    const state = view.state;
    const nextQuery = new SearchQuery({ ...query, search: field.value });

    if (!nextQuery.eq(query)) {
      query = nextQuery;
      const effects = setSearchQuery.of(query);

      if (query.valid) {
        const cursor = query.getCursor(state);
        const matches = [];

        for (let match = cursor.next(); !match.done; match = cursor.next()) {
          matches.push(match.value);
        }
        const selected = matches.find((match) => match.from >= state.selection.main.from) ?? matches[0];

        view.dispatch(selected ? {
          effects,
          selection:      { anchor: selected.from, head: selected.to },
          scrollIntoView: true
        } : { effects });
      } else {
        view.dispatch({ effects });
      }
      updateCount();
    }
  });

  dom.addEventListener('keydown', (event) => {
    if (runScopeHandlers(view, event, 'search-panel')) {
      event.preventDefault();
    } else if (event.key === 'Enter' && event.target === field) {
      event.preventDefault();
      (event.shiftKey ? findPrevious : findNext)(view);
    }
  });

  updateCount();

  return {
    dom,
    top:    true,
    mount:  () => field.select(),
    update: (update: ViewUpdate) => {
      const currentQuery = getSearchQuery(update.state);

      if (!currentQuery.eq(query)) {
        query = currentQuery;
        field.value = query.search;
      }
      if (update.docChanged || update.selectionSet || update.transactions.some((transaction) => transaction.effects.some((effect) => effect.is(setSearchQuery)))) {
        updateCount();
      }
    }
  };
}
