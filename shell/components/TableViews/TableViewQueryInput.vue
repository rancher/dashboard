<script>
import {
  LABEL_FIELD_PREFIX, highlightQuery, quoteIfNeeded, replaceToken, scanQuery, tokenAt, valuesInUse
} from '@shell/utils/table-views';

/**
 * GitHub style filter input.
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
export default {
  name: 'TableViewQueryInput',

  emits: ['update:value', 'request-values'],

  props: {
    value: {
      type:    String,
      default: ''
    },

    /**
     * ViewField[] - everything that can be filtered on
     */
    fields: {
      type:    Array,
      default: () => []
    },

    /**
     * fieldId -> values in use, fetched from the api by the owning table. When a field has no
     * entry here yet we fall back to the values on the current page.
     */
    fieldValues: {
      type:    Object,
      default: () => ({})
    },

    /**
     * The rows to read the "values in use" from
     */
    rows: {
      type:    Array,
      default: () => []
    },
  },

  data() {
    return {
      caret:        0,
      focused:      false,
      activeIndex:  0,
      /** Where to put the caret once the tokens have been re-rendered, if we own it */
      pendingCaret: null,
      /** True while an IME is composing, when the DOM must be left alone */
      composing:    false,
      /** Where the suggestion menu sits, in viewport coordinates (it hangs off <body>) */
      menuPos:      {
        top: 0, left: 0, width: 0
      },
      /**
       * True when the box holds a keystroke the query has not caught up to yet.
       *
       * The query round trips through the parent, so between a keystroke and the re-render there
       * is a moment where the box is ahead. Redrawing from the query then would throw whatever
       * was typed in that moment away - which is how `state:running` arrived as `stat:ru`.
       */
      domAhead: false,
    };
  },

  computed: {
    /**
     * The coloured runs that make up the box's contents. Their text concatenated is the query.
     */
    segments() {
      return highlightQuery(this.value || '', this.fields, (fieldId, value) => this.isKnownValue(fieldId, value));
    },

    /**
     * The values each field in the query actually has, lowercased, so a term can be checked
     * against them.
     *
     * Only the fields the query mentions, and worked out once per render - the page scan behind
     * it walks up to a thousand rows and there is one term per badge.
     */
    knownValues() {
      const out = {};

      this.terms.forEach((term) => {
        const field = term.field;

        if (!field || out[field.id]) {
          return;
        }

        const fetched = this.fieldValues[field.id];
        // The api's list covers every row; the page scan is the fallback while it loads
        const available = fetched?.length ? fetched : valuesInUse(this.rows, field);

        out[field.id] = new Set(available.map((entry) => entry.value.toLowerCase()));
      });

      return out;
    },

    /** Every field the query names, so their values can be fetched and their terms checked */
    queryFieldIds() {
      return Array.from(new Set(this.terms.map((term) => term.field?.id).filter((id) => !!id)));
    },

    /** Changes exactly when the drawn tokens would differ */
    segmentsKey() {
      return this.segments.map((segment) => `${ segment.kind }:${ segment.text }`).join('\u0000');
    },

    terms() {
      return scanQuery(this.value || '', this.fields).filter((token) => token.kind === 'term');
    },

    activeToken() {
      return tokenAt(this.value || '', this.caret, this.fields);
    },

    /**
     * The term the caret is in, broken into the field (if it resolves) and the value typed so far
     */
    parsedToken() {
      const token = this.activeToken;

      if (!token) {
        return {
          negate: '', field: null, typed: ''
        };
      }

      return {
        negate: token.negate || '',
        field:  token.field || null,
        // `value` rather than `text`: the raw token still carries a leading `-` or `!`, and
        // matching field names against "-sta" found nothing, so negating a term lost the
        // suggestions entirely
        typed:  token.value,
      };
    },

    /**
     * Watched instead of the field itself: `fields` is rebuilt whenever the rows change, so the
     * field object's identity turns over constantly while its id does not. Asking the owning
     * table for the same values on every row update is a request loop waiting to happen.
     */
    activeFieldId() {
      return this.parsedToken.field?.id || null;
    },

    suggestions() {
      const { negate, field, typed } = this.parsedToken;
      const needle = typed.toLowerCase();

      if (field) {
        const fetched = this.fieldValues[field.id];
        // Values from the api cover every row; the page scan is only a fallback while they load
        const available = fetched?.length ? fetched : valuesInUse(this.rows, field);

        return available
          .filter((entry) => entry.value.toLowerCase().includes(needle))
          .map((entry) => ({
            key:    `${ field.id }:${ entry.value }`,
            label:  entry.value,
            detail: this.t('tableViews.query.inUse', { count: entry.count }),
            insert: `${ negate }${ field.id }:${ quoteIfNeeded(entry.value) } `,
            value:  entry.value,
          }));
      }

      return this.fields
        .filter((f) => f.id.toLowerCase().includes(needle) || f.label.toLowerCase().includes(needle))
        .slice(0, 20)
        .map((f) => ({
          key:    f.id,
          label:  f.isLabel ? `${ LABEL_FIELD_PREFIX }${ f.label }` : f.id,
          detail: f.isLabel ? this.t('tableViews.query.label') : f.label,
          // A field on its own gets no connective - there is nothing to join until it has a value
          insert: `${ negate }${ f.id }:`,
          field:  f,
        }));
    },

    showSuggestions() {
      return this.focused && !!this.suggestions.length;
    },

    menuStyle() {
      // Width is left to the stylesheet: the menu is as wide as its entries need, not as wide as
      // the box it hangs under. Only where it sits comes from the box.
      return {
        top:  `${ this.menuPos.top }px`,
        left: `${ this.menuPos.left }px`,
      };
    },
  },

  watch: {
    /**
     * Ask the owning table for the values in use for every field the query names - the page we
     * can see is rarely the whole story, and a badge is only drawn for a value the field has.
     *
     * Every field in the query rather than just the one being typed, because a view applied from
     * a tab arrives with its terms already written and nothing typed at all.
     */
    queryFieldIds: {
      handler(ids) {
        ids.forEach((id) => {
          if (!this.fieldValues[id]) {
            this.$emit('request-values', id);
          }
        });
      },
      immediate: true,
    },

    suggestions() {
      this.activeIndex = 0;
    },

    /**
     * The menu hangs off <body>, so it has to be told where the box is - and told again whenever
     * anything moves underneath it
     */
    showSuggestions(open) {
      if (open) {
        this.$nextTick(() => this.updateMenuPos());
        window.addEventListener('scroll', this.updateMenuPos, true);
        window.addEventListener('resize', this.updateMenuPos);
      } else {
        window.removeEventListener('scroll', this.updateMenuPos, true);
        window.removeEventListener('resize', this.updateMenuPos);
      }
    },

    /**
     * Redraw only when the tokens actually differ. `segments` is rebuilt whenever the fields are,
     * which is on every row update - redrawing on that would yank the caret while typing.
     */
    segmentsKey() {
      this.syncDom();
    },
  },

  mounted() {
    this.syncDom();
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.updateMenuPos, true);
    window.removeEventListener('resize', this.updateMenuPos);
  },

  methods: {
    /**
     * Rebuild the box's contents from the query.
     *
     * Everything already in there goes first, browser inserted nodes included, so what is left is
     * exactly the tokens. Rebuilding loses the caret, hence putting it back at the end.
     */
    syncDom() {
      const root = this.$refs.input;

      if (!root || this.composing) {
        return;
      }

      // Typing that hasn't come back round yet. The keystroke that set this off will render in
      // its own turn, so leave what the user has in front of them alone.
      if (this.domAhead && root.textContent !== (this.value || '')) {
        return;
      }

      this.domAhead = false;

      while (root.firstChild) {
        root.removeChild(root.firstChild);
      }

      this.segments.forEach((segment) => {
        const span = document.createElement('span');

        span.className = `segment-${ segment.kind }`;
        span.textContent = segment.text;
        root.appendChild(span);
      });

      // `focused` trails a blur by 150ms so a click on a suggestion can land first. Asking the
      // document instead is immediate, and a redraw in that window would otherwise leave the
      // caret nowhere - which the browser reads as the start of the box.
      if (document.activeElement === root) {
        this.applyCaret(this.pendingCaret ?? this.caret);
      }

      this.pendingCaret = null;
    },

    /**
     * How many characters of the query sit before the caret.
     *
     * Counted across the token spans rather than read off one text node, so it is the same
     * offset the query string uses.
     */
    readCaret() {
      const root = this.$refs.input;
      const selection = window.getSelection();

      if (!root || !selection?.rangeCount) {
        return null;
      }

      const range = selection.getRangeAt(0);

      // The selection can sit outside the box, or on nodes a redraw has just detached. Saying so
      // beats reporting the last known offset: a stale 0 would drop the next keystroke at the
      // start of the query, and the one after that in front of it, typing the text backwards.
      if (!root.contains(range.endContainer)) {
        return null;
      }

      const upto = range.cloneRange();

      upto.selectNodeContents(root);
      upto.setEnd(range.endContainer, range.endOffset);

      return upto.toString().length;
    },

    /**
     * Put the caret `offset` characters into the query, wherever that lands among the tokens
     */
    applyCaret(offset) {
      const root = this.$refs.input;

      if (!root) {
        return;
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      let remaining = Math.max(0, Math.min(offset, (root.textContent || '').length));
      let node = walker.nextNode();
      let last = null;

      while (node) {
        if (remaining <= node.textContent.length) {
          range.setStart(node, remaining);
          break;
        }

        remaining -= node.textContent.length;
        last = node;
        node = walker.nextNode();
      }

      if (!node) {
        // Past the end of the text, so sit at the end of whatever the last token was
        if (last) {
          range.setStart(last, last.textContent.length);
        } else {
          range.selectNodeContents(root);
        }
      }

      range.collapse(true);

      const selection = window.getSelection();

      selection.removeAllRanges();
      selection.addRange(range);
      this.caret = Math.max(0, Math.min(offset, (root.textContent || '').length));
    },

    /**
     * Is `value` one this field actually has? Case insensitively, the way the query matches.
     */
    isKnownValue(fieldId, value) {
      if (!value) {
        return false;
      }

      return !!this.knownValues[fieldId]?.has(`${ value }`.toLowerCase());
    },

    updateMenuPos() {
      const rect = this.$el?.getBoundingClientRect?.();

      if (rect) {
        this.menuPos = {
          top: rect.bottom + 2, left: rect.left, width: rect.width
        };
      }
    },

    syncCaret() {
      const at = this.readCaret();

      if (at !== null) {
        this.caret = at;
      }
    },

    onInput() {
      if (this.composing) {
        return;
      }

      const text = this.$refs.input?.textContent ?? '';

      // Typing with the caret unreadable means it has just gone in at the end
      this.caret = this.readCaret() ?? text.length;
      this.pendingCaret = this.caret;
      this.domAhead = true;
      this.$emit('update:value', text);
    },

    onCompositionEnd() {
      this.composing = false;
      this.onInput();
    },

    /**
     * Paste arrives as whatever was copied, so it is flattened to a single line of plain text
     * and spliced in over the selection
     */
    onPaste(event) {
      const text = (event.clipboardData || window.clipboardData)?.getData('text') || '';
      const flat = text.replace(/\s+/g, ' ').trim();
      const root = this.$refs.input;
      const selection = window.getSelection();

      if (!root || !selection?.rangeCount) {
        return;
      }

      const range = selection.getRangeAt(0);
      const before = range.cloneRange();

      before.selectNodeContents(root);
      before.setEnd(range.startContainer, range.startOffset);

      const start = before.toString().length;
      const end = start + range.toString().length;
      const current = this.value || '';
      const next = `${ current.substring(0, start) }${ flat }${ current.substring(end) }`;

      this.pendingCaret = start + flat.length;
      // Written by us, so the box is the stale one and has to be redrawn
      this.domAhead = false;
      this.$emit('update:value', next);
    },

    onBlur() {
      // Let a click on a suggestion land before the list goes away, then only stand down if the
      // box really did lose focus - a blur it comes straight back from would otherwise close the
      // suggestions while the user is still typing into them
      setTimeout(() => {
        if (document.activeElement !== this.$refs.input) {
          this.focused = false;
        }
      }, 150);
    },

    onKeyDown(event) {
      // One line only - Enter picks a suggestion, it never breaks the query in two
      if (event.key === 'Enter') {
        event.preventDefault();
      }

      if (!this.showSuggestions) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % this.suggestions.length;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length;
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.pick(this.suggestions[this.activeIndex]);
      } else if (event.key === 'Escape') {
        this.focused = false;
      }
    },

    /**
     * Write the chosen field or value into the query, in place of whatever was being typed.
     *
     * Nothing is added around it: no `and`/`or` is written for the user (they are free to type
     * one), and a value already in the query goes in again like any other - repeating a term is
     * harmless and refusing it silently was more confusing than the repetition.
     */
    pick(suggestion) {
      if (!suggestion) {
        return;
      }

      const token = this.activeToken;
      const next = replaceToken(this.value || '', token, suggestion.insert);

      this.pendingCaret = token ? token.start + suggestion.insert.length : next.length;
      // Written by us, so the box is the stale one and has to be redrawn
      this.domAhead = false;
      this.$emit('update:value', next);
      this.focus();
    },

    focus() {
      this.$refs.input?.focus();
    },
  }
};
</script>

<template>
  <div
    class="table-view-query"
    :class="{ focused }"
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
      role="textbox"
      aria-multiline="false"
      spellcheck="false"
      data-testid="table-views-query"
      :data-placeholder="t('tableViews.query.placeholder')"
      :aria-label="t('tableViews.query.placeholder')"
      @input="onInput"
      @paste.prevent="onPaste"
      @compositionstart="composing = true"
      @compositionend="onCompositionEnd"
      @click="syncCaret"
      @keyup="syncCaret"
      @keydown="onKeyDown"
      @focus="focused = true"
      @blur="onBlur"
    />
    <i class="icon icon-search" />
    <!-- Hung off <body> rather than left inside the toolbar. The table masthead is its own
         stacking context (`fixedTableHeader`), so a menu nested in it can only ever layer against
         its siblings - the table's own state badges were coming out on top of the list. -->
    <Teleport to="body">
      <ul
        v-if="showSuggestions"
        class="table-view-query-menu"
        :style="menuStyle"
        data-testid="table-views-suggestions"
      >
        <li
          v-for="(suggestion, i) in suggestions"
          :key="suggestion.key"
          :class="{ active: i === activeIndex }"
          @mousedown.prevent="pick(suggestion)"
          @mouseenter="activeIndex = i"
        >
          <span class="suggestion-label">{{ suggestion.label }}</span>
          <span class="suggestion-detail">{{ suggestion.detail }}</span>
        </li>
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
    border-color: var(--primary);
  }

  .query-input {
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

    &.is-empty::before {
      content: attr(data-placeholder);
      color: var(--input-placeholder);
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
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--accent-btn);
    color: var(--primary);
  }

  // Half typed, or simply not a value this field has: plain text until it is one
  .segment-value-unknown {
    color: var(--input-text);
  }

  // The spelled out logic is chrome rather than something the user wrote, so it recedes
  .segment-connective {
    color: var(--muted);
    font-style: italic;
  }

  > .icon-search {
    flex: none;
    margin-left: 8px;
    color: var(--muted);
    font-size: 16px;
  }

}

// Teleported to <body>, so positioned against the viewport and layered on the shared dropdown
// level rather than against whatever stacking context the table happens to build
.table-view-query-menu {
  position: fixed;
  z-index: z-index('dropdownContent');
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

  .suggestion-detail {
    opacity: 0.6;
    font-size: 12px;
    white-space: nowrap;
  }
}
</style>
