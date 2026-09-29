<script setup lang="ts">
/**
 * The table views filter box: `field:value` terms and free text, suggesting fields and then values
 * in use. It edits its own rendered tokens, so a value badge's spacing is ordinary layout and the
 * caret stays true
 */
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useStore } from 'vuex';

import RcSeparator from '@components/RcSeparator/RcSeparator.vue';
import { useI18n } from '@shell/composables/useI18n';
import { LABEL_FIELD_PREFIX, dateBuckets, valuesInUse } from '@shell/utils/table-views/fields';
import {
  CONNECTIVES, NEGATORS, highlightQuery, isNegator, quoteIfNeeded, replaceToken, scanQuery, tokenAt
} from '@shell/utils/table-views/query';
import type { TableViewField, TableViewRow } from '@shell/types/table-views';

const MENU_VIEWPORT_MARGIN = 20;

/** The stylesheet's `min-width`, to measure by before the list is on the page */
const MENU_MIN_WIDTH = 260;

/**
 * The list's border plus an option's padding, so the entry text rather than the box lines up with
 * the caret
 */
const MENU_TEXT_INSET = 13;

/** Beyond the list's edges, for its shadow, on a side that isn't cut */
const MENU_SHADOW_ROOM = 30;

const KEY_SEP = '\u0000';

let uid = 0;

interface Suggestion {
  key: string;
  label: string;
  detail?: string;
  insert: string;
  connective?: boolean;
  field?: TableViewField;
  value?: string;
}

const props = withDefaults(defineProps<{
  value?: string,
  /** Everything the query can name, including fields this list can't filter by, so it can say so */
  fields?: TableViewField[],
  /** The fields worth suggesting, when narrower than `fields`. Defaults to `fields` */
  filterFields?: TableViewField[] | null,
  /** fieldId -> values in use from the api; the rows on the page are the fallback */
  fieldValues?: Record<string, { value: string, count: number }[]>,
  rows?: TableViewRow[],
  /** Ids of the fields that hold dates, whose values are offered as years and months */
  dateFields?: string[],
}>(), {
  value:        '',
  fields:       () => [],
  filterFields: null,
  fieldValues:  () => ({}),
  rows:         () => [],
  dateFields:   () => [],
});

const emit = defineEmits<{
  'update:value': [value: string],
  'request-values': [fieldId: string],
  'update:focused': [focused: boolean],
}>();

/** A field's values as the box offers them: the api's where it has them, else the page's; dates by month */
const valuesFor = (field: TableViewField) => {
  const fetched = props.fieldValues[field.id];

  if (props.dateFields.includes(field.id)) {
    return dateBuckets(fetched?.length ? fetched : valuesInUse(props.rows, field, Infinity));
  }

  return fetched?.length ? fetched : valuesInUse(props.rows, field);
};

const { t } = useI18n(useStore());

const root = ref<HTMLElement | null>(null);
const input = ref<HTMLElement | null>(null);
const menu = ref<HTMLElement | null>(null);

const caret = ref(0);
const focused = ref(false);
/** Escape hides the list without taking the caret out of the box */
const dismissed = ref(false);
const activeIndex = ref(0);
const pendingCaret = ref<number | null>(null);
const composing = ref(false);
/** Viewport coordinates: the menu hangs off <body> */
const menuPos = ref({
  top: 0, left: 0, width: 0, clip: 'none'
});
/** What the menu has to outrank, read as it opens: a slide-in panel sits above the product's z-index scale */
const menuZ = ref(0);
/** The box is scrolled out of sight, and with it the list */
const menuOutOfView = ref(false);
/**
 * Hidden until placed: a press that opens the list sets the caret after the box takes focus, so the
 * first placement would be at the old caret, then jump
 */
const menuPlaced = ref(false);
let placeFrame = 0;
/**
 * The box is ahead of the query between a keystroke and the re-render; redrawing then drops what
 * was typed
 */
const domAhead = ref(false);

const instanceId = `${ uid++ }`;

/** Per instance, as a page can hold more than one box */
const menuId = computed(() => `table-view-query-menu-${ instanceId }`);

const optionId = (index: number) => `${ menuId.value }-option-${ index }`;

const terms = computed(() => scanQuery(props.value || '', props.fields).filter((token) => token.kind === 'term'));

/** Worked out once per render: the page scan walks up to a thousand rows, and there is one term per badge */
const knownValues = computed(() => {
  const out: Record<string, Set<string>> = {};

  terms.value.forEach((term) => {
    const field = term.field;

    if (!field || out[field.id]) {
      return;
    }

    out[field.id] = new Set(valuesFor(field).map((entry) => entry.value.toLowerCase()));
  });

  return out;
});

const isKnownValue = (fieldId: string, value: unknown): boolean => {
  if (!value) {
    return false;
  }

  return !!knownValues.value[fieldId]?.has(`${ value }`.toLowerCase());
};

const segments = computed(() => highlightQuery(props.value || '', props.fields, (fieldId: string, value: unknown) => isKnownValue(fieldId, value)));

const queryFieldIds = computed(() => Array.from(new Set(terms.value.map((term) => term.field?.id).filter((id): id is string => !!id))));

const segmentsKey = computed(() => segments.value.map((segment) => `${ segment.kind }:${ segment.text }`).join(KEY_SEP));

const activeToken = computed(() => tokenAt(props.value || '', caret.value, props.fields));

const parsedToken = computed(() => {
  const token = activeToken.value;

  if (!token) {
    return {
      negate: '', field: null, typed: ''
    };
  }

  return {
    negate: token.negate || '',
    field:  token.field || null,
    // `value` rather than `text`, which still carries a leading `-` or `!`
    typed:  token.value,
  };
});

/** The finished token before the caret, which decides whether a joining word fits here */
const precedingToken = computed(() => {
  const active = activeToken.value;

  const before = scanQuery(props.value || '', props.fields)
    .filter((token) => token.end <= caret.value && (!active || token.start !== active.start));

  return before[before.length - 1] || null;
});

/** `not` can lead or follow anything finished; `and` and `or` need a finished term before them */
const connectiveSuggestions = computed<Suggestion[]>(() => {
  const { negate, field, typed } = parsedToken.value;

  if (field || negate) {
    return [];
  }

  const previous = precedingToken.value;
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

const showClear = computed(() => !!props.value);

const suggestableFields = computed<TableViewField[]>(() => props.filterFields || props.fields);

const suggestions = computed<Suggestion[]>(() => {
  const { negate, field, typed } = parsedToken.value;
  const needle = typed.toLowerCase();

  if (field) {
    // The page scan would offer real-looking values for a term that is then ignored
    if (!suggestableFields.value.some((f) => f.id === field.id)) {
      return [];
    }

    return valuesFor(field)
      .filter((entry) => entry.value.toLowerCase().includes(needle))
      .map((entry) => ({
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
      insert: `${ negate }${ f.id }:`,
      field:  f,
    })));
});

/**
 * Split into runs where the kind changes, for the rules between them. Each keeps its flat index for
 * the keyboard
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

const suggestionsKey = computed(() => suggestions.value.map((suggestion) => suggestion.key).join(KEY_SEP));

const showSuggestions = computed(() => focused.value && !dismissed.value && !!suggestions.value.length);

const activeDescendantId = computed(() => (showSuggestions.value ? optionId(activeIndex.value) : undefined));

/** A combobox announces its active option, but not that a list appeared or how long it is */
const suggestionsAnnouncement = computed(() => {
  if (!showSuggestions.value) {
    return '';
  }

  return t('tableViews.query.suggestionsAvailable', { count: suggestions.value.length }, true);
});

const menuStyle = computed(() => ({
  // Width is the stylesheet's: as wide as the entries need
  top:                  `${ menuPos.value.top }px`,
  left:                 `${ menuPos.value.left }px`,
  clipPath:             menuPos.value.clip,
  '--query-menu-stack': menuZ.value,
  ...(menuPlaced.value ? {} : { visibility: 'hidden' as const }),
}));

/** Counted across the token spans, so it is an offset into the query string */
const readCaret = (): number | null => {
  const el = input.value;
  const selection = window.getSelection();

  if (!el || !selection?.rangeCount) {
    return null;
  }

  const range = selection.getRangeAt(0);

  // A stale offset would put the next keystroke at the start, typing text backwards
  if (!el.contains(range.endContainer)) {
    return null;
  }

  const upto = range.cloneRange();

  upto.selectNodeContents(el);
  upto.setEnd(range.endContainer, range.endOffset);

  return upto.toString().length;
};

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
  keepCaretInView(range);
};

/** A caret placed from code isn't scrolled to, as a typed one is */
const keepCaretInView = (range: Range) => {
  const el = input.value;
  const at = range.getBoundingClientRect();

  if (!el || !(at.left || at.top)) {
    return;
  }

  const box = el.getBoundingClientRect();

  if (at.left > box.right) {
    el.scrollLeft += at.left - box.right + 1;
  } else if (at.left < box.left) {
    el.scrollLeft -= box.left - at.left;
  }
};

/** Rebuild the box from the query, browser inserted nodes included */
const syncDom = () => {
  const el = input.value;

  if (!el || composing.value) {
    return;
  }

  // A keystroke still on its way back; leave what the user sees alone
  if (domAhead.value && el.textContent !== (props.value || '')) {
    return;
  }

  domAhead.value = false;

  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }

  segments.value.forEach((segment) => {
    const span = document.createElement('span');

    span.className = `segment-${ segment.kind }`;
    span.textContent = segment.text;
    el.appendChild(span);
  });

  // Not `focused`, which trails a blur by 150ms
  if (document.activeElement === el) {
    applyCaret(pendingCaret.value ?? caret.value);
  }

  pendingCaret.value = null;
};

/**
 * Browsers give no rect for some collapsed ranges; the box's left edge is the caret in exactly
 * those cases
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

      if (rect && (rect.left || rect.top)) {
        return rect.left;
      }
    }
  }

  return el.getBoundingClientRect().left;
};

/** The highest z-index among the box's ancestors, since the menu is their sibling on <body> */
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

/** Where the box can be seen: the viewport, less what its scrolling ancestors cut off */
const visibleArea = () => {
  const area = {
    top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth
  };

  for (let el = root.value?.parentElement; el && el !== document.body; el = el.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(el);

    if (overflowX !== 'visible' || overflowY !== 'visible') {
      const clip = el.getBoundingClientRect();

      area.top = Math.max(area.top, clip.top);
      area.left = Math.max(area.left, clip.left);
      area.bottom = Math.min(area.bottom, clip.bottom);
      area.right = Math.min(area.right, clip.right);
    }
  }

  return area;
};

const updateMenuPos = () => {
  const rect = root.value?.getBoundingClientRect?.();

  if (rect) {
    // The size is only known once rendered
    const width = menu.value?.offsetWidth || MENU_MIN_WIDTH;
    const height = menu.value?.offsetHeight || 0;
    const rightmost = Math.max(MENU_VIEWPORT_MARGIN, window.innerWidth - width - MENU_VIEWPORT_MARGIN);
    // Over the box's bottom border, so the two 1px edges meet as one line
    const top = rect.bottom - 1;
    const left = Math.min((caretLeft() ?? rect.left) - MENU_TEXT_INSET, rightmost);
    const area = visibleArea();
    // The list hangs off <body>, so it can't pass under the header and nav as the box does; it is
    // cut where they start instead. A side with nothing to cut leaves room for the shadow
    const cut = [area.top - top, left + width - area.right, top + height - area.bottom, area.left - left];

    menuPos.value = {
      top,
      left,
      width: rect.width,
      clip:  cut.some((px) => px > 0) ? `inset(${ cut.map((px) => (px > 0 ? `${ Math.ceil(px) }px` : `-${ MENU_SHADOW_ROOM }px`)).join(' ') })` : 'none',
    };
    menuOutOfView.value = rect.bottom <= area.top || rect.bottom > area.bottom || rect.right <= area.left || rect.left >= area.right;
  }

  menuZ.value = stackAbove();
};

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

  dismissed.value = false;

  const text = input.value?.textContent ?? '';

  caret.value = readCaret() ?? text.length;
  pendingCaret.value = caret.value;
  domAhead.value = true;
  emit('update:value', text);
};

const onCompositionEnd = () => {
  composing.value = false;
  onInput();
};

/** Flattened to one line and spliced in over the selection */
const onPaste = (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData('text') || '';
  const flat = text.replace(/\s+/g, ' ').trim();
  const el = input.value;

  if (!el) {
    return;
  }

  const current = props.value || '';
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

  // Only a selection inside this box counts; one left elsewhere by copying means nothing here
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
  // Written by us, so the box is the stale one
  domAhead.value = false;
  emit('update:value', next);
};

const onFocus = () => {
  focused.value = true;
  dismissed.value = false;
  emit('update:focused', true);
};

/** Placed afresh even when the caret lands where it was, which the caret watcher wouldn't see */
const onClick = () => {
  dismissed.value = false;
  syncCaret();
  repositionMenu();
};

/**
 * Chrome puts a press on no text into the nearest editable spot, which in the toolbar is this box,
 * so presses on its ancestors are refused
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
  // Let a click on a suggestion land first, and ignore a blur the box comes straight back from
  setTimeout(() => {
    if (document.activeElement !== input.value) {
      focused.value = false;
      emit('update:focused', false);
    }
  }, 150);
};

/** `dismissed` is left alone: Escape already closed the list, and the button never did */
const clear = () => {
  pendingCaret.value = 0;
  // Written by us, so the box is the stale one
  domAhead.value = false;
  emit('update:value', '');
  focus();
};

/** Nothing is written around the pick, and a repeated term is allowed */
const pick = (suggestion?: Suggestion) => {
  if (!suggestion) {
    return;
  }

  const token = activeToken.value;
  const value = props.value || '';
  const next = replaceToken(value, token, suggestion.insert, caret.value);

  pendingCaret.value = token ? token.start + suggestion.insert.length : caret.value + (next.length - value.length);
  // Written by us, so the box is the stale one
  domAhead.value = false;
  emit('update:value', next);
  focus();
};

/** Arrowing scrolls the list under a still pointer, whose `mouseenter` would take the highlight back */
const keyboardNav = ref(false);

/** Wraps at either end, scrolling the entry into view */
const moveActive = (delta: number) => {
  const count = suggestions.value.length;

  if (!count) {
    return;
  }

  keyboardNav.value = true;
  activeIndex.value = (activeIndex.value + delta + count) % count;

  nextTick(() => {
    const list = menu.value;
    const at = activeIndex.value;

    if (!list) {
      return;
    }

    // `nearest` would leave the list's padding scrolled off at the ends
    if (at === 0 || at === suggestions.value.length - 1) {
      list.scrollTop = at === 0 ? 0 : list.scrollHeight;

      return;
    }

    list.querySelector(`[id="${ optionId(at) }"]`)?.scrollIntoView({ block: 'nearest' });
  });
};

const onSuggestionHover = (index: number) => {
  if (keyboardNav.value) {
    return;
  }

  activeIndex.value = index;
};

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
  }

  if (!showSuggestions.value) {
    if (event.key === 'Escape' && props.value) {
      event.preventDefault();
      clear();
    }

    return;
  }

  // A list that can't be seen can't be picked from
  if (menuOutOfView.value) {
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveActive(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveActive(-1);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    pick(suggestions.value[activeIndex.value]);
  } else if (event.key === 'Escape') {
    dismissed.value = true;
  }
};

/** Every field the query names, since a view applied from a tab arrives with nothing typed */
watch(queryFieldIds, (ids) => {
  ids.forEach((id: string) => {
    if (!props.fieldValues[id]) {
      emit('request-values', id);
    }
  });
}, { immediate: true });

/** Keyed on the contents: the computed array is new whenever the caret moves */
watch(suggestionsKey, () => {
  activeIndex.value = 0;
  repositionMenu();
});

watch(caret, () => repositionMenu());

watch(showSuggestions, (open) => {
  cancelAnimationFrame(placeFrame);

  if (open) {
    menuPlaced.value = false;
    // A frame on, the press has put the caret down; the list is then built for it and placed
    placeFrame = requestAnimationFrame(() => {
      syncCaret();
      nextTick(() => {
        updateMenuPos();
        menuPlaced.value = true;
      });
    });
    window.addEventListener('scroll', updateMenuPos, true);
    window.addEventListener('resize', updateMenuPos);
  } else {
    window.removeEventListener('scroll', updateMenuPos, true);
    window.removeEventListener('resize', updateMenuPos);
  }
});

/** `segments` is rebuilt on every row update; redrawing then would yank the caret */
watch(segmentsKey, () => syncDom());

onMounted(() => {
  syncDom();
  // Capture, so it is seen before the browser decides what the press means
  document.addEventListener('mousedown', onOutsideMouseDown, true);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(placeFrame);
  document.removeEventListener('mousedown', onOutsideMouseDown, true);
  window.removeEventListener('scroll', updateMenuPos, true);
  window.removeEventListener('resize', updateMenuPos);
});
</script>

<template>
  <div
    ref="root"
    class="table-view-query"
    :class="{ focused, 'list-open': showSuggestions }"
  >
    <!-- Filled by syncDom, not a v-for: the browser inserts its own nodes while typing, which Vue
         won't remove -->
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
    <!-- Always present, so the query doesn't shift as the mark comes and goes. `mousedown.prevent`
         so the box keeps focus and its caret -->
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
    <!-- Outside the Teleport: a live region must already be on the page when its text changes -->
    <span
      class="sr-only"
      aria-live="polite"
      aria-atomic="true"
    >{{ suggestionsAnnouncement }}</span>
    <!-- The table masthead is its own stacking context, so a menu inside it could only layer
         against its siblings -->
    <Teleport to="body">
      <ul
        v-if="showSuggestions"
        :id="menuId"
        ref="menu"
        class="vs__dropdown-menu table-view-query-menu"
        role="listbox"
        :aria-label="t('tableViews.query.suggestions')"
        :style="menuStyle"
        data-testid="table-views-suggestions"
        @mousemove="keyboardNav = false"
      >
        <template
          v-for="(group, g) in suggestionGroups"
          :key="group.kind"
        >
          <!-- Decorative: a listbox's children are its options -->
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
            @mouseenter="onSuggestionHover(entry.index)"
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

<style lang="scss" scoped>
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
    // `--primary` falls under 3:1 on the dark input; `--primary-border` is tuned per theme
    border-color: var(--primary-border);
  }

  &.list-open {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
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
    scrollbar-width: none;
    // A line that can't wrap would otherwise be the box's minimum width, widening the toolbar
    // rather than scrolling
    contain: inline-size;

    &::-webkit-scrollbar {
      display: none;
    }

    &:focus {
      outline: none;
      box-shadow: none;
    }

    // Out of the flow, or the unwrappable placeholder would set the box's minimum width
    &.is-empty::before {
      content: attr(data-placeholder);
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      overflow: hidden;
      color: var(--input-placeholder);
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
    }
  }

  > .query-affordance {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    width: 14px;
    margin-left: 8px;
  }

  .icon-search {
    color: var(--muted);
    font-size: 14px;
  }

  // Undo the global button's 40px line-height and min-height
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

// Teleported, so fixed to the viewport. Styled as the product's select dropdown
// (vendor/vue-select.scss), overriding only the position and width
.table-view-query-menu {
  position: fixed;
  left: auto;
  z-index: max(#{z-index('dropdownContent')}, var(--query-menu-stack, 0));
  width: auto;
  min-width: 260px;
  max-width: 380px;
  margin: 0;
  list-style: none;

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

  li.suggestion-rule {
    display: block;
    padding: 0;
    cursor: default;

    hr {
      margin: 7px 0;
    }
  }

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

<!-- Not scoped: syncDom builds these spans, so they carry no scope attribute -->
<style lang="scss">
.table-view-query {
  .segment-field {
    color: var(--input-text);
  }

  .segment-value {
    margin-left: 4px;
    padding: 0 4px;
    border-radius: 4px;
    // Mixed from a live token: the compiled tints stay Rancher blue on a Prime install
    background: color-mix(in srgb, var(--active, var(--primary)) 12%, transparent);
    // `--link` keeps its blue in dark on Prime; `--active` follows the brand
    color: var(--active, var(--primary));
  }

  .segment-value-unknown {
    color: var(--input-text);
  }

  .segment-connective {
    color: var(--input-text);
    font-style: italic;
  }
}
</style>
