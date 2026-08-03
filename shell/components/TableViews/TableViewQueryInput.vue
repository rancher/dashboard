<script>
import {
  LABEL_FIELD_PREFIX, findField, quoteIfNeeded, replaceToken, tokenAt, valuesInUse
} from '@shell/utils/table-views';

/**
 * GitHub style filter input.
 *
 * Accepts a query of `field:value` terms plus free text and, as the user types, offers
 * the fields available on this table and then the values actually in use in the data.
 */
export default {
  name: 'TableViewQueryInput',

  emits: ['update:value'],

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
     * The rows to read the "values in use" from
     */
    rows: {
      type:    Array,
      default: () => []
    },

    /**
     * How many rows the current query matches — shown as a small pill inside the input.
     */
    matchCount: {
      type:    Number,
      default: 0
    },
  },

  data() {
    return {
      caret:       0,
      focused:     false,
      activeIndex: 0,
    };
  },

  computed: {
    activeToken() {
      return tokenAt(this.value || '', this.caret);
    },

    /**
     * Break the token under the caret into `-`, a field (if it resolves) and the value typed so far
     */
    parsedToken() {
      let text = this.activeToken?.text || '';
      let negate = '';

      if (text.startsWith('-') || text.startsWith('!')) {
        negate = text.substring(0, 1);
        text = text.substring(1);
      }

      const idx = text.indexOf(':');

      if (idx > 0) {
        let field = findField(this.fields, text.substring(0, idx));

        if (!field && text.toLowerCase().startsWith(LABEL_FIELD_PREFIX)) {
          field = findField(this.fields, text.substring(0, text.lastIndexOf(':')));
        }

        if (field) {
          return {
            negate, field, typed: text.substring(field.id.length + 1).replace(/^["']|["']$/g, '')
          };
        }
      }

      return {
        negate, field: null, typed: text
      };
    },

    suggestions() {
      const { negate, field, typed } = this.parsedToken;
      const needle = typed.toLowerCase();

      if (field) {
        return valuesInUse(this.rows, field)
          .filter((entry) => entry.value.toLowerCase().includes(needle))
          .map((entry) => ({
            key:    `${ field.id }:${ entry.value }`,
            label:  entry.value,
            detail: this.t('tableViews.query.inUse', { count: entry.count }),
            insert: `${ negate }${ field.id }:${ quoteIfNeeded(entry.value) } `,
          }));
      }

      return this.fields
        .filter((f) => f.id.toLowerCase().includes(needle) || f.label.toLowerCase().includes(needle))
        .slice(0, 20)
        .map((f) => ({
          key:    f.id,
          label:  f.isLabel ? `${ LABEL_FIELD_PREFIX }${ f.label }` : f.id,
          detail: f.isLabel ? this.t('tableViews.query.label') : f.label,
          insert: `${ negate }${ f.id }:`,
        }));
    },

    showSuggestions() {
      return this.focused && !!this.suggestions.length;
    },
  },

  watch: {
    suggestions() {
      this.activeIndex = 0;
    }
  },

  methods: {
    syncCaret(event) {
      this.caret = event.target.selectionStart ?? (this.value || '').length;
    },

    onInput(event) {
      this.syncCaret(event);
      this.$emit('update:value', event.target.value);
    },

    onBlur() {
      // Let a click on a suggestion land before the list goes away
      setTimeout(() => {
        this.focused = false;
      }, 150);
    },

    onKeyDown(event) {
      if (!this.showSuggestions) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.activeIndex = (this.activeIndex + 1) % this.suggestions.length;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.activeIndex = (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length;
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        this.pick(this.suggestions[this.activeIndex]);
      } else if (event.key === 'Escape') {
        this.focused = false;
      }
    },

    pick(suggestion) {
      if (!suggestion) {
        return;
      }

      const next = replaceToken(this.value || '', this.activeToken, suggestion.insert);

      this.$emit('update:value', next);

      const caret = (this.activeToken?.start ?? (this.value || '').length) + suggestion.insert.length;

      this.$nextTick(() => {
        const input = this.$refs.input;

        if (input) {
          input.focus();
          input.setSelectionRange(caret, caret);
          this.caret = caret;
        }
      });
    },

    clear() {
      this.$emit('update:value', '');
      this.$refs.input?.focus();
    },
  }
};
</script>

<template>
  <div class="table-view-query">
    <i class="icon icon-search" />
    <input
      ref="input"
      :value="value"
      type="text"
      class="query-input"
      data-testid="table-views-query"
      :placeholder="t('tableViews.query.placeholder')"
      :aria-label="t('tableViews.query.placeholder')"
      @input="onInput"
      @click="syncCaret"
      @keyup="syncCaret"
      @keydown="onKeyDown"
      @focus="focused = true"
      @blur="onBlur"
    >
    <span
      v-if="value"
      class="match-pill"
      data-testid="table-views-match-count"
    >{{ matchCount }}</span>
    <i
      v-if="value"
      class="icon icon-close clear"
      data-testid="table-views-query-clear"
      @click="clear"
    />
    <ul
      v-if="showSuggestions"
      class="suggestions"
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
  </div>
</template>

<style lang="scss" scoped>
.table-view-query {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 240px;
  border: 1px solid var(--input-border);
  border-radius: var(--border-radius);
  background: var(--input-bg);
  padding: 0 8px;

  > .icon-search {
    opacity: 0.6;
  }

  .query-input {
    border: none;
    background: transparent;
    height: 34px;
    padding: 0 6px;
    flex: 1;

    &:focus {
      outline: none;
      box-shadow: none;
    }
  }

  // Match-count pill inside the input — just the number, our usual rounded count pill
  .match-pill {
    flex: none;
    padding: 1px 8px;
    margin: 0 4px;
    border-radius: 10px;
    background: var(--disabled-bg);
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    white-space: nowrap;
  }

  .clear {
    cursor: pointer;
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }

  .suggestions {
    position: absolute;
    top: calc(100% + 2px);
    left: 0;
    right: auto;
    min-width: 260px;
    max-width: 380px;
    z-index: 100;
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
}
</style>
