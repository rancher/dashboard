<script setup lang="ts">
/**
 * Filter input for the table views toolbar.
 *
 * Accepts a query of `field:value` terms plus free text and, as the user types, offers the
 * fields available on this table and then the values actually in use in the data.
 *
 * The box edits its own rendering. An earlier version painted the colours on a layer behind a
 * plain `<input>`, which is simpler, but the two only stay lined up while they hold identical
 * text at identical metrics - the moment a value badge takes a margin, every glyph after it
 * slides out from under the caret. Editing the rendered tokens directly means the spacing
 * around a badge is ordinary layout and the caret is wherever the browser puts it.
 */
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useStore } from 'vuex';

import RcSeparator from '@components/RcSeparator/RcSeparator.vue';
import { useI18n } from '@shell/composables/useI18n';
import {
  CONNECTIVES, LABEL_FIELD_PREFIX, NEGATORS, highlightQuery, isNegator, quoteIfNeeded, replaceToken, scanQuery, tokenAt, valuesInUse
} from '@shell/utils/table-views';
import type { ViewField } from '@shell/utils/table-views';

/** How close to the window's edge the list may come when the caret it follows is near one */
const MENU_VIEWPORT_MARGIN = 20;

/** The stylesheet's `min-width` for the list, to measure by before it is on the page */
const MENU_MIN_WIDTH = 260;

/**
 * How far an entry's text sits inside the list - its own border plus an option's left padding,
 * both a few rules down in the stylesheet.
 *
 * What follows the caret is the text, not the box around it. Hanging the box's edge off the
 * caret put every entry a word-width to the right of the term it was being offered for.
 */
const MENU_TEXT_INSET = 13;

/** Separates the parts of a key that only has to change when its parts do */
const KEY_SEP = '\u0000';

/** Tells one box's listbox from another's when a page carries more than one */
let uid = 0;

interface Suggestion {
  key: string;
  label: string;
  detail?: string;
  insert: string;
  connective?: boolean;
  field?: ViewField;
  value?: string;
}

const props = withDefaults(defineProps<{
  value?: string,
  /**
   * Everything the query can name. Used to read what has been typed, which has to cover fields
   * this list cannot actually filter by: the toolbar says so afterwards, and it can only do that
   * if the term was recognised as naming a field in the first place.
   */
  fields?: ViewField[],
  /**
   * The subset worth offering, when it is narrower than `fields`.
   *
   * Server side the api filters only on the fields it indexes and drops terms naming the rest.
   * Suggesting one of those would be handing someone a term the list then has to report it
   * ignored. Defaults to `fields`.
   */
  filterFields?: ViewField[] | null,
  /**
   * fieldId -> values in use, fetched from the api by the owning table. When a field has no entry
   * here yet we fall back to the values on the current page.
   */
  fieldValues?: Record<string, { value: string, count: number }[]>,
  /** The rows to read the "values in use" from */
  rows?: any[],
}>(), {
  value:        '',
  fields:       () => [],
  filterFields: null,
  fieldValues:  () => ({}),
  rows:         () => [],
});

const emit = defineEmits<{
  'update:value': [value: string],
  'request-values': [fieldId: string],
  'update:focused': [focused: boolean],
}>();

const { t } = useI18n(useStore());

const root = ref<HTMLElement | null>(null);
const input = ref<HTMLElement | null>(null);
const menu = ref<HTMLElement | null>(null);

const caret = ref(0);
const focused = ref(false);
/**
 * True when the list has been dismissed with Escape. Kept apart from `focused` so that dismissing
 * it does not take the caret out of the box - the query is still being written, and the next
 * keystroke brings the list back.
 */
const dismissed = ref(false);
/** Whether the pointer is over the box, which is when the clear is offered */
const hovered = ref(false);
const activeIndex = ref(0);
/** Where to put the caret once the tokens have been re-rendered, if we own it */
const pendingCaret = ref<number | null>(null);
/** True while an IME is composing, when the DOM must be left alone */
const composing = ref(false);
/** Where the suggestion menu sits, in viewport coordinates (it hangs off <body>) */
const menuPos = ref({
  top: 0, left: 0, width: 0
});
/**
 * What the menu has to outrank to be seen. The stylesheet holds the floor, so 0 here means
 * nothing the box sits in claims a layer worth clearing.
 *
 * The menu hangs off <body>, so it layers against whatever else is there - and a slide-in panel
 * puts itself at 102, above the whole of the product's z-index scale. Read at the moment the menu
 * opens rather than assumed, so it stays above whatever it is opened over.
 */
const menuZ = ref(0);
/**
 * True when the box holds a keystroke the query has not caught up to yet.
 *
 * The query round trips through the parent, so between a keystroke and the re-render there is a
 * moment where the box is ahead. Redrawing from the query then would throw whatever was typed in
 * that moment away - which is how `state:running` arrived as `stat:ru`.
 */
const domAhead = ref(false);

const instanceId = `${ uid++ }`;

/**
 * The list's own id, so the box can point at it.
 *
 * Per instance: more than one of these can be on a page, and two listboxes sharing an id would
 * have the box pointing at whichever the browser found first.
 */
const menuId = computed(() => `table-view-query-menu-${ instanceId }`);

const optionId = (index: number) => `${ menuId.value }-option-${ index }`;

const terms = computed(() => scanQuery(props.value || '', props.fields).filter((token: any) => token.kind === 'term'));

/**
 * The values each field in the query actually has, lowercased, so a term can be checked against
 * them.
 *
 * Only the fields the query mentions, and worked out once per render - the page scan behind it
 * walks up to a thousand rows and there is one term per badge.
 */
const knownValues = computed(() => {
  const out: Record<string, Set<string>> = {};

  terms.value.forEach((term: any) => {
    const field = term.field;

    if (!field || out[field.id]) {
      return;
    }

    const fetched = props.fieldValues[field.id];
    // The api's list covers every row; the page scan is the fallback while it loads
    const available = fetched?.length ? fetched : valuesInUse(props.rows, field);

    out[field.id] = new Set(available.map((entry: any) => entry.value.toLowerCase()));
  });

  return out;
});

/**
 * Is `value` one this field actually has? Case insensitively, the way the query matches.
 */
const isKnownValue = (fieldId: string, value: unknown): boolean => {
  if (!value) {
    return false;
  }

  return !!knownValues.value[fieldId]?.has(`${ value }`.toLowerCase());
};

/**
 * The coloured runs that make up the box's contents. Their text concatenated is the query.
 */
const segments = computed(() => highlightQuery(props.value || '', props.fields, (fieldId: string, value: unknown) => isKnownValue(fieldId, value)));

/** Every field the query names, so their values can be fetched and their terms checked */
const queryFieldIds = computed(() => Array.from(new Set(terms.value.map((term: any) => term.field?.id).filter((id: string) => !!id))));

/** Changes exactly when the drawn tokens would differ */
const segmentsKey = computed(() => segments.value.map((segment: any) => `${ segment.kind }:${ segment.text }`).join(KEY_SEP));

const activeToken = computed(() => tokenAt(props.value || '', caret.value, props.fields));

/**
 * The term the caret is in, broken into the field (if it resolves) and the value typed so far
 */
const parsedToken = computed(() => {
  const token: any = activeToken.value;

  if (!token) {
    return {
      negate: '', field: null, typed: ''
    };
  }

  return {
    negate: token.negate || '',
    field:  token.field || null,
    // `value` rather than `text`: the raw token still carries a leading `-` or `!`, and matching
    // field names against "-sta" found nothing, so negating a term lost the suggestions entirely
    typed:  token.value,
  };
});

/**
 * The token the caret is following, which is what decides whether a joining word can go here.
 * The one the caret is inside does not count - that is the word being typed.
 */
const precedingToken = computed(() => {
  const active: any = activeToken.value;

  const before = scanQuery(props.value || '', props.fields)
    .filter((token: any) => token.end <= caret.value && (!active || token.start !== active.start));

  return before[before.length - 1] || null;
});

/**
 * `and`, `or` and `not`, offered only where they would read.
 *
 * `not` negates whatever comes next, so it can open a query or follow a joining word, and it can
 * follow a finished term too - that is the implicit `and` with the next term left out. `and` and
 * `or` join two terms, so they need a finished one behind them. Nothing joins onto a `not` that is
 * still waiting for its term, and nothing joins onto a value being typed.
 */
const connectiveSuggestions = computed<Suggestion[]>(() => {
  const { negate, field, typed } = parsedToken.value;

  // Mid-value, or mid `-term`: a joining word is not what comes next
  if (field || negate) {
    return [];
  }

  const previous: any = precedingToken.value;
  let allowed;

  if (!previous) {
    allowed = NEGATORS;
  } else if (previous.kind === 'connective') {
    allowed = isNegator(previous.text) ? [] : NEGATORS;
  } else {
    allowed = [...CONNECTIVES, ...NEGATORS];
  }

  const needle = typed.toLowerCase();

  return allowed
    .filter((word: string) => word.includes(needle))
    .map((word: string) => ({
      key:        `connective:${ word }`,
      label:      word,
      detail:     t(`tableViews.query.connective.${ word }`),
      insert:     `${ word } `,
      connective: true,
    }));
});

/**
 * Whether to offer the clear in place of the lens.
 *
 * Only under the pointer: the mark is there to be reached for, and standing in the box for the
 * whole time a query is being written it was one more thing to read past. The keyboard is not left
 * without a way out - Escape empties the box, which is why this can be a pointer-only affordance
 * rather than something that has to stay reachable by Tab.
 */
const showClear = computed(() => !!props.value && hovered.value);

/** The fields offered by name, which can be narrower than the ones a query may mention */
const suggestableFields = computed<ViewField[]>(() => props.filterFields || props.fields);

const suggestions = computed<Suggestion[]>(() => {
  const { negate, field, typed } = parsedToken.value;
  const needle = typed.toLowerCase();

  if (field) {
    // A field this list cannot be filtered by gets nothing offered for it either. The api has no
    // values to give for one, so the fallback is a scan of the page in front of us - which would
    // be offering real-looking values for a term that is then thrown away.
    if (!suggestableFields.value.some((f) => f.id === field.id)) {
      return [];
    }

    const fetched = props.fieldValues[field.id];
    // Values from the api cover every row; the page scan is only a fallback while they load
    const available = fetched?.length ? fetched : valuesInUse(props.rows, field);

    return available
      .filter((entry: any) => entry.value.toLowerCase().includes(needle))
      .map((entry: any) => ({
        key:    `${ field.id }:${ entry.value }`,
        label:  entry.value,
        detail: t('tableViews.query.inUse', { count: entry.count }),
        insert: `${ negate }${ field.id }:${ quoteIfNeeded(entry.value) } `,
        value:  entry.value,
      }));
  }

  return connectiveSuggestions.value.concat(suggestableFields.value
    .filter((f) => f.id.toLowerCase().includes(needle) || f.label.toLowerCase().includes(needle))
    .slice(0, 20)
    .map((f) => ({
      key:    f.id,
      label:  f.isLabel ? `${ LABEL_FIELD_PREFIX }${ f.label }` : f.id,
      detail: f.isLabel ? t('tableViews.query.label') : f.label,
      // A field on its own gets no connective - there is nothing to join until it has a value
      insert: `${ negate }${ f.id }:`,
      field:  f,
    })));
});

/**
 * The same suggestions, split into the runs the list draws a rule between: the words that join
 * terms, the table's own columns, and the labels its rows carry.
 *
 * Split where the kind changes rather than sorted into buckets, so the list is shown in the order
 * `suggestions` built it and a rule only ever appears where one run really ends. Each entry keeps
 * its position in the flat list, which is what the keyboard moves through.
 */
const suggestionGroups = computed(() => {
  const kindOf = (suggestion: Suggestion) => {
    if (suggestion.connective) {
      return 'joiner';
    }

    return suggestion.field?.isLabel ? 'label' : 'field';
  };

  type Group = { kind: string, entries: (Suggestion & { index: number })[] };
  const groups: Group[] = [];
  let current: Group | null = null;

  suggestions.value.forEach((suggestion, index) => {
    const kind = kindOf(suggestion);

    if (!current || current.kind !== kind) {
      current = { kind, entries: [] };
      groups.push(current);
    }

    current.entries.push({ ...suggestion, index });
  });

  return groups;
});

/** Changes exactly when the list's contents do, and not when it is merely rebuilt */
const suggestionsKey = computed(() => suggestions.value.map((suggestion) => suggestion.key).join(KEY_SEP));

const showSuggestions = computed(() => focused.value && !dismissed.value && !!suggestions.value.length);

/** The option the keyboard is on, which is what the box reports as its active descendant */
const activeDescendantId = computed(() => (showSuggestions.value ? optionId(activeIndex.value) : undefined));

/**
 * What a screen reader is told when the list opens or moves.
 *
 * A combobox announces its active option on its own, but not that a list appeared or how long it
 * is - which is the part that tells someone there is anything to arrow through.
 */
const suggestionsAnnouncement = computed(() => {
  if (!showSuggestions.value) {
    return '';
  }

  return t('tableViews.query.suggestionsAvailable', { count: suggestions.value.length }, true);
});

const menuStyle = computed(() => ({
  // Width is left to the stylesheet: the menu is as wide as its entries need, not as wide as the
  // box it hangs under. Only where it sits comes from the box.
  top:                  `${ menuPos.value.top }px`,
  left:                 `${ menuPos.value.left }px`,
  '--query-menu-stack': menuZ.value,
}));

/**
 * How many characters of the query sit before the caret.
 *
 * Counted across the token spans rather than read off one text node, so it is the same offset the
 * query string uses.
 */
const readCaret = (): number | null => {
  const el = input.value;
  const selection = window.getSelection();

  if (!el || !selection?.rangeCount) {
    return null;
  }

  const range = selection.getRangeAt(0);

  // The selection can sit outside the box, or on nodes a redraw has just detached. Saying so beats
  // reporting the last known offset: a stale 0 would drop the next keystroke at the start of the
  // query, and the one after that in front of it, typing the text backwards.
  if (!el.contains(range.endContainer)) {
    return null;
  }

  const upto = range.cloneRange();

  upto.selectNodeContents(el);
  upto.setEnd(range.endContainer, range.endOffset);

  return upto.toString().length;
};

/**
 * Put the caret `offset` characters into the query, wherever that lands among the tokens
 */
const applyCaret = (offset: number) => {
  const el = input.value;

  if (!el) {
    return;
  }

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let remaining = Math.max(0, Math.min(offset, (el.textContent || '').length));
  let node = walker.nextNode();
  let last: Node | null = null;

  while (node) {
    if (remaining <= (node.textContent || '').length) {
      range.setStart(node, remaining);
      break;
    }

    remaining -= (node.textContent || '').length;
    last = node;
    node = walker.nextNode();
  }

  if (!node) {
    // Past the end of the text, so sit at the end of whatever the last token was
    if (last) {
      range.setStart(last, (last.textContent || '').length);
    } else {
      range.selectNodeContents(el);
    }
  }

  range.collapse(true);

  const selection = window.getSelection();

  selection?.removeAllRanges();
  selection?.addRange(range);
  caret.value = Math.max(0, Math.min(offset, (el.textContent || '').length));
};

/**
 * Rebuild the box's contents from the query.
 *
 * Everything already in there goes first, browser inserted nodes included, so what is left is
 * exactly the tokens. Rebuilding loses the caret, hence putting it back at the end.
 */
const syncDom = () => {
  const el = input.value;

  if (!el || composing.value) {
    return;
  }

  // Typing that hasn't come back round yet. The keystroke that set this off will render in its own
  // turn, so leave what the user has in front of them alone.
  if (domAhead.value && el.textContent !== (props.value || '')) {
    return;
  }

  domAhead.value = false;

  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }

  segments.value.forEach((segment: any) => {
    const span = document.createElement('span');

    span.className = `segment-${ segment.kind }`;
    span.textContent = segment.text;
    el.appendChild(span);
  });

  // `focused` trails a blur by 150ms so a click on a suggestion can land first. Asking the document
  // instead is immediate, and a redraw in that window would otherwise leave the caret nowhere -
  // which the browser reads as the start of the box.
  if (document.activeElement === el) {
    applyCaret(pendingCaret.value ?? caret.value);
  }

  pendingCaret.value = null;
};

/**
 * Where the caret is on screen, for the list to hang under.
 *
 * A collapsed range does not always have a rect of its own - sitting at the very start of a text
 * node, or in an element with no text in it yet, browsers hand back nothing at all - so the box's
 * own left edge stands in, which is where the caret is in exactly those cases.
 */
const caretLeft = (): number | null => {
  const el = input.value;

  if (!el) {
    return null;
  }

  const selection = window.getSelection();

  if (selection?.rangeCount) {
    const range = selection.getRangeAt(0);

    if (el.contains(range.startContainer)) {
      const rect = range.getBoundingClientRect();

      // An empty rect is the browser declining to place the range, not a caret at the window's
      // corner
      if (rect && (rect.left || rect.top)) {
        return rect.left;
      }
    }
  }

  return el.getBoundingClientRect().left;
};

/**
 * The z-index the menu needs to be seen from where the box is.
 *
 * Everything the box sits inside that layers itself, taken together: the highest of them is what
 * the menu has to beat, because the menu is a sibling of the lot of them down on <body>. Zero when
 * nothing along the way claims a layer, which leaves the stylesheet to say.
 */
const stackAbove = () => {
  let el = root.value?.parentElement;
  let highest = 0;

  while (el && el !== document.documentElement) {
    const z = parseInt(getComputedStyle(el).zIndex, 10);

    if (!isNaN(z) && z > highest) {
      highest = z;
    }

    el = el.parentElement;
  }

  return highest ? highest + 1 : 0;
};

const updateMenuPos = () => {
  const rect = root.value?.getBoundingClientRect?.();

  if (rect) {
    // The list is as wide as its entries, which is only known once it has been rendered - until
    // then the narrowest it is allowed to be is the closest guess there is
    const width = menu.value?.getBoundingClientRect().width || MENU_MIN_WIDTH;
    // Following the caret walks the list towards the right-hand edge, so it stops short of it
    // rather than hanging off the page
    const rightmost = Math.max(MENU_VIEWPORT_MARGIN, window.innerWidth - width - MENU_VIEWPORT_MARGIN);

    const at = (caretLeft() ?? rect.left) - MENU_TEXT_INSET;

    menuPos.value = {
      top:   rect.bottom + 2,
      left:  Math.min(Math.max(at, MENU_VIEWPORT_MARGIN), rightmost),
      width: rect.width
    };
  }

  menuZ.value = stackAbove();
};

/** Put the list back under the caret, once whatever moved it has been rendered */
const repositionMenu = () => {
  if (showSuggestions.value) {
    nextTick(() => updateMenuPos());
  }
};

const syncCaret = () => {
  const at = readCaret();

  if (at !== null) {
    caret.value = at;
  }
};

const focus = () => input.value?.focus();

const onInput = () => {
  if (composing.value) {
    return;
  }

  // Escape puts the list away; writing more of the query is asking for it again
  dismissed.value = false;

  const text = input.value?.textContent ?? '';

  // Typing with the caret unreadable means it has just gone in at the end
  caret.value = readCaret() ?? text.length;
  pendingCaret.value = caret.value;
  domAhead.value = true;
  emit('update:value', text);
};

const onCompositionEnd = () => {
  composing.value = false;
  onInput();
};

/**
 * Paste arrives as whatever was copied, so it is flattened to a single line of plain text and
 * spliced in over the selection
 */
const onPaste = (event: ClipboardEvent) => {
  const text = (event.clipboardData || (window as any).clipboardData)?.getData('text') || '';
  const flat = text.replace(/\s+/g, ' ').trim();
  const el = input.value;

  if (!el) {
    return;
  }

  const current = props.value || '';
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

  // Where the paste lands. The selection is only worth measuring when it is actually in this box:
  // a selection left elsewhere on the page - which is exactly what copying something else leaves
  // behind - measured against this box gives an offset that means nothing here. The browser's own
  // paste is already prevented by then, so nothing arrived at all and the box looked like it would
  // not take a paste. Falling back to the caret this box tracks is what it does the rest of the
  // time anyway.
  let start = Math.min(caret.value ?? current.length, current.length);
  let end = start;

  if (range && el.contains(range.startContainer) && el.contains(range.endContainer)) {
    const before = range.cloneRange();

    before.selectNodeContents(el);
    before.setEnd(range.startContainer, range.startOffset);

    start = before.toString().length;
    end = start + range.toString().length;
  }

  const next = `${ current.substring(0, start) }${ flat }${ current.substring(end) }`;

  pendingCaret.value = start + flat.length;
  // Written by us, so the box is the stale one and has to be redrawn
  domAhead.value = false;
  emit('update:value', next);
};

const onFocus = () => {
  focused.value = true;
  dismissed.value = false;
  emit('update:focused', true);
};

/**
 * Clicking into the box is asking for the list as much as typing is, so a dismissed one comes back
 */
const onClick = () => {
  dismissed.value = false;
  syncCaret();
};

/**
 * A press anywhere but on the box puts the list away - and, where the browser would have handed us
 * the caret anyway, is refused outright.
 *
 * Chrome answers a press that lands on no text of its own by looking for the nearest editable
 * position underneath it, and inside the toolbar the only one is this box. That is why clicking the
 * empty band above or below the row was landing in the query. Only ancestors are refused: anything
 * else the pointer can reach is a thing in its own right and is left to do whatever it does.
 */
const onOutsideMouseDown = (event: MouseEvent) => {
  const el = root.value;
  const target = event.target as HTMLElement | null;

  if (!el || !target || el.contains(target) || menu.value?.contains?.(target)) {
    return;
  }

  if (target.contains?.(el)) {
    event.preventDefault();
  }

  focused.value = false;
  emit('update:focused', false);

  if (document.activeElement === input.value) {
    input.value?.blur();
  }
};

const onBlur = () => {
  // Let a click on a suggestion land before the list goes away, then only stand down if the box
  // really did lose focus - a blur it comes straight back from would otherwise close the
  // suggestions while the user is still typing into them
  setTimeout(() => {
    if (document.activeElement !== input.value) {
      focused.value = false;
      emit('update:focused', false);
    }
  }, 150);
};

/**
 * Empty the box, for the clear button and for Escape.
 *
 * `dismissed` is deliberately left as it is. Escape has already put the list away by the time it
 * gets here, and reopening it on the same key the user pressed to close things would be arguing
 * with them - while clearing by the button was never a dismissal, so the list comes back the way it
 * does for any other empty box.
 */
const clear = () => {
  pendingCaret.value = 0;
  // Written by us, so the box is the stale one and has to be redrawn
  domAhead.value = false;
  emit('update:value', '');
  focus();
};

/**
 * Write the chosen field or value into the query, in place of whatever was being typed.
 *
 * Nothing is added around it: no `and`/`or` is written for the user (they are free to type one),
 * and a value already in the query goes in again like any other - repeating a term is harmless and
 * refusing it silently was more confusing than the repetition.
 */
const pick = (suggestion?: Suggestion) => {
  if (!suggestion) {
    return;
  }

  const token: any = activeToken.value;
  const value = props.value || '';
  const next = replaceToken(value, token, suggestion.insert, caret.value);

  // Where the caret belongs once it is written: over a token, just past what replaced it. Spliced
  // at the caret instead, it moves by however much longer the query got - which counts the space
  // replaceToken adds when the caret was not already following one.
  pendingCaret.value = token ? token.start + suggestion.insert.length : caret.value + (next.length - value.length);
  // Written by us, so the box is the stale one and has to be redrawn
  domAhead.value = false;
  emit('update:value', next);
  focus();
};

const onKeyDown = (event: KeyboardEvent) => {
  // One line only - Enter picks a suggestion, it never breaks the query in two
  if (event.key === 'Enter') {
    event.preventDefault();
  }

  if (!showSuggestions.value) {
    // With no list open, Escape has the box itself to act on
    if (event.key === 'Escape' && props.value) {
      event.preventDefault();
      clear();
    }

    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % suggestions.value.length;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeIndex.value = (activeIndex.value - 1 + suggestions.value.length) % suggestions.value.length;
  } else if (event.key === 'Enter') {
    event.preventDefault();
    pick(suggestions.value[activeIndex.value]);
  } else if (event.key === 'Escape') {
    dismissed.value = true;
  }
};

/**
 * Ask the owning table for the values in use for every field the query names - the page we can see
 * is rarely the whole story, and a badge is only drawn for a value the field has.
 *
 * Every field in the query rather than just the one being typed, because a view applied from a tab
 * arrives with its terms already written and nothing typed at all.
 */
watch(queryFieldIds, (ids) => {
  ids.forEach((id: string) => {
    if (!props.fieldValues[id]) {
      emit('request-values', id);
    }
  });
}, { immediate: true });

/**
 * Back to the top when the list itself changes.
 *
 * Keyed on what is in the list rather than on the array: `suggestions` is a computed, so it hands
 * back a new array whenever anything it reads changes - the caret included. Watching the array
 * meant the first arrow key moved the caret, rebuilt an identical list, and reset the cursor it had
 * just moved.
 */
watch(suggestionsKey, () => {
  activeIndex.value = 0;
  // A different list is a different width, and the width is what decides how far right it is
  // allowed to sit
  repositionMenu();
});

/** The list follows the caret, so it moves for an arrow key as much as for a keystroke */
watch(caret, () => repositionMenu());

/**
 * The menu hangs off <body>, so it has to be told where the box is - and told again whenever
 * anything moves underneath it
 */
watch(showSuggestions, (open) => {
  if (open) {
    nextTick(() => updateMenuPos());
    window.addEventListener('scroll', updateMenuPos, true);
    window.addEventListener('resize', updateMenuPos);
  } else {
    window.removeEventListener('scroll', updateMenuPos, true);
    window.removeEventListener('resize', updateMenuPos);
  }
});

/**
 * Redraw only when the tokens actually differ. `segments` is rebuilt whenever the fields are, which
 * is on every row update - redrawing on that would yank the caret while typing.
 */
watch(segmentsKey, () => syncDom());

onMounted(() => {
  syncDom();
  // Capture, so it is seen before the browser decides what the press means
  document.addEventListener('mousedown', onOutsideMouseDown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutsideMouseDown, true);
  window.removeEventListener('scroll', updateMenuPos, true);
  window.removeEventListener('resize', updateMenuPos);
});
</script>

<template>
  <div
    ref="root"
    class="table-view-query"
    :class="{ focused }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- The tokens are the editable content, so a badge's margin is ordinary layout rather than
         something that has to be kept in step with a separate input.

         Deliberately empty here: the spans are built by syncDom rather than by a v-for. Typing
         into a contenteditable makes the browser insert its own nodes, and Vue will not remove
         nodes it did not create - they pile up beside the rendered ones and every keystroke gets
         counted twice. Owning the contents outright is what keeps the DOM and the query equal. -->
    <div
      ref="input"
      class="query-input"
      :class="{ 'is-empty': !value }"
      contenteditable="true"
      role="combobox"
      aria-multiline="false"
      aria-autocomplete="list"
      :aria-expanded="showSuggestions ? 'true' : 'false'"
      :aria-controls="menuId"
      :aria-activedescendant="activeDescendantId"
      spellcheck="false"
      data-testid="table-views-query"
      :data-placeholder="t('tableViews.query.placeholder')"
      :aria-label="t('tableViews.query.placeholder')"
      @input="onInput"
      @paste.prevent="onPaste"
      @compositionstart="composing = true"
      @compositionend="onCompositionEnd"
      @click="onClick"
      @keyup="syncCaret"
      @keydown="onKeyDown"
      @focus="onFocus"
      @blur="onBlur"
    />
    <!-- One slot at the end of the box, holding at most one mark: the lens while the box is
         empty, the clear under the pointer once there is a query, and nothing at all in between
         - a query being written has no need of either.

         The slot is always here even when it holds nothing, because the box beside it is what
         takes up the remaining width: letting it come and go would move the query sideways by
         the width of a mark every time the pointer crossed the box.

         `mousedown` rather than `click`, and prevented: the button taking focus blurs the box,
         which puts the list away and leaves the caret nowhere - so clearing would cost a click
         back in before anything could be typed. `.left` because mousedown fires for every
         button, and a right-click belongs to the context menu rather than to this. -->
    <span class="query-affordance">
      <button
        v-if="showClear"
        type="button"
        class="query-clear"
        :aria-label="t('tableViews.query.clear')"
        data-testid="table-views-query-clear"
        @mousedown.left.prevent="clear"
      >
        <i class="icon icon-close" />
      </button>
      <i
        v-else-if="!value"
        class="icon icon-search"
      />
    </span>
    <!-- A combobox announces the option the keyboard is on, but nothing says a list appeared or
         how long it is. Outside the Teleport so it is never torn down with the list itself -
         a live region has to be on the page before the text changes for the change to be read. -->
    <span
      class="sr-only"
      aria-live="polite"
      aria-atomic="true"
    >{{ suggestionsAnnouncement }}</span>
    <!-- Hung off <body> rather than left inside the toolbar. The table masthead is its own
         stacking context (`fixedTableHeader`), so a menu nested in it can only ever layer against
         its siblings - the table's own state badges were coming out on top of the list. -->
    <Teleport to="body">
      <ul
        v-if="showSuggestions"
        :id="menuId"
        ref="menu"
        class="table-view-query-menu"
        role="listbox"
        :aria-label="t('tableViews.query.suggestions')"
        :style="menuStyle"
        data-testid="table-views-suggestions"
      >
        <template
          v-for="(group, g) in suggestionGroups"
          :key="group.kind"
        >
          <!-- Decorative, not a `separator` role: a listbox's children are its options, and a
               rule announced between them is one more thing to step past on the way down. -->
          <li
            v-if="g"
            class="suggestion-rule"
            role="presentation"
          >
            <rc-separator />
          </li>
          <li
            v-for="entry in group.entries"
            :id="optionId(entry.index)"
            :key="entry.key"
            role="option"
            :aria-selected="entry.index === activeIndex ? 'true' : 'false'"
            :class="{ active: entry.index === activeIndex }"
            @mousedown.prevent="pick(entry)"
            @mouseenter="activeIndex = entry.index"
          >
            <span
              class="suggestion-label"
              :class="{ connective: entry.connective }"
            >{{ entry.label }}</span>
            <span class="suggestion-detail">{{ entry.detail }}</span>
          </li>
        </template>
      </ul>
    </Teleport>
  </div>
</template>

<!-- Not scoped: syncDom builds the token spans, so they carry no scope attribute. Every rule
     below is nested under .table-view-query, which keeps it to this component. -->
<style lang="scss">
$query-height: 32px;

.table-view-query {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 240px;
  height: $query-height;
  border: 1px solid var(--input-border);
  border-radius: var(--border-radius);
  background: var(--input-bg);
  padding: 0 12px;

  &.focused {
    // Not `--primary`, which is one value for both themes: 1px of it on the dark input background
    // measured 2.93:1, under the 3:1 a control's boundary needs. This is the same blue the
    // product's focus ring uses, which is the one that is tuned per theme.
    border-color: var(--primary-keyboard-focus);
  }

  .query-input {
    position: relative;
    flex: 1;
    min-width: 0;
    height: 100%;
    font-family: inherit;
    font-size: 14px;
    line-height: $query-height - 2px;
    color: var(--input-text);
    white-space: pre;
    overflow-x: auto;
    overflow-y: hidden;
    // The query is one line; nothing pasted into it is allowed to make it two
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    &:focus {
      outline: none;
      box-shadow: none;
    }

    // Taken out of the flow, so the box's own `min-width` is what decides how narrow it may be.
    // In the flow the placeholder is a line that cannot wrap, so it became the box's smallest
    // possible width - and the toolbar's, which then held the page open at nearly twice the
    // width it needs. What the box says while empty should not set what it costs.
    //
    // Pinned to all four sides of the box it belongs to, which is why that box is positioned:
    // left alone it hung off the nearest positioned ancestor instead, and on a narrow window it
    // ran out over the lens and the View button beside it. Here it is trimmed instead.
    &.is-empty::before {
      content: attr(data-placeholder);
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      overflow: hidden;
      // The box's own line-height does the centring. `display: flex` would have done it too, but
      // a flex container has no text of its own to trim, so the tail was cut without the ellipsis
      // that says it had been.
      color: var(--input-placeholder);
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
    }
  }

  .segment-field {
    color: var(--input-text);
  }

  // A value the field really has reads as a badge around that value and nothing else. The gap
  // between the colon and it is this margin - there is no space in the query itself.
  .segment-value {
    margin-left: 4px;
    padding: 0 4px;
    border-radius: 4px;
    // Mixed from the same token the text uses rather than taken from one of the theme's tints.
    // Every `-banner-bg` / `-light-bg` is compiled from the scss palette, so it holds Rancher
    // blue on a Prime install where the brand has gone green - and `--link-banner-bg` has no
    // dark value at all. Mixing from a live token is what the app bar's drag state does too.
    background: color-mix(in srgb, var(--active, var(--primary)) 12%, transparent);
    // `--active` over `--link`: `--link` follows the brand in light but keeps its blue in dark,
    // so on a Prime install the badge changed colour in one theme and not the other. In stock
    // Rancher light the two are a single blue channel apart.
    color: var(--active, var(--primary));
  }

  // Half typed, or simply not a value this field has: plain text until it is one
  .segment-value-unknown {
    color: var(--input-text);
  }

  // The words joining the terms are the plain text of the query - the blue is kept for the values
  // the query is matching on, so that colour means one thing in here
  .segment-connective {
    color: var(--input-text);
    font-style: italic;
  }

  // The one slot, kept at the lens's width whatever is in it - see the template
  > .query-affordance {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    width: 16px;
    margin-left: 8px;
  }

  .icon-search {
    color: var(--muted);
    font-size: 16px;
  }

  // Filling the slot, and no taller than the row around it.
  //
  // That last part has to be said out loud: the product gives every bare `button` a 40px line
  // and a 40px floor under its height, both taller than the 32px row this one sits in, and the
  // whole toolbar grew by 10px the moment the mark first appeared. Both have to be undone - the
  // floor outlives the line-height on its own. Stretched to the row rather than left at the size
  // of the mark, so the target is the height of the box.
  .query-clear {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    width: 100%;
    min-height: 0;
    padding: 0;
    border: none;
    background: none;
    color: var(--muted);
    line-height: 1;
    cursor: pointer;

    .icon {
      font-size: 14px;
    }

    &:hover {
      color: var(--input-text);
    }

    &:focus-visible {
      @include focus-outline;
    }
  }

}

// Teleported to <body>, so positioned against the viewport and layered on the shared dropdown
// level rather than against whatever stacking context the table happens to build.
//
// The shared level is the floor, not the answer: a slide-in panel puts itself above the whole of
// that scale, so a box opened inside one hands down what it has to clear and the higher wins.
.table-view-query-menu {
  position: fixed;
  z-index: max(#{z-index('dropdownContent')}, var(--query-menu-stack, 0));
  min-width: 260px;
  max-width: 380px;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  max-height: 320px;
  overflow-y: auto;
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px var(--shadow);

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 6px 12px;
    cursor: pointer;

    &.active {
      background: var(--dropdown-hover-bg);
      color: var(--dropdown-hover-text);
    }
  }

  // The rule between runs, drawn the way the product's own menus draw one: edge to edge, and
  // carrying its own breathing room rather than the padding an option gets
  li.suggestion-rule {
    display: block;
    padding: 0;
    cursor: default;

    hr {
      margin: 7px 0;
    }
  }

  // The joining words are set the way the query itself sets them, which tells them apart from
  // the fields they are listed beside
  .suggestion-label.connective {
    font-style: italic;
  }

  .suggestion-detail {
    opacity: 0.6;
    font-size: 12px;
    white-space: nowrap;
  }
}
</style>
