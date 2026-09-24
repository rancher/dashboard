<script>
import RcSeparator from '@components/RcSeparator/RcSeparator.vue';
import {
  CONNECTIVES, LABEL_FIELD_PREFIX, NEGATORS, highlightQuery, isNegator, quoteIfNeeded, replaceToken, scanQuery, tokenAt, valuesInUse
} from '@shell/utils/table-views';

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
/** Tells one box's listbox from another's when a page carries more than one */
let uid = 0;

export default {
  name: 'TableViewQueryInput',

  components: { RcSeparator },

  emits: ['update:value', 'request-values', 'update:focused'],

  props: {
    value: {
      type:    String,
      default: ''
    },

    /**
     * ViewField[] - everything the query can name. Used to read what has been typed, which has to
     * cover fields this list cannot actually filter by: the toolbar says so afterwards, and it
     * can only do that if the term was recognised as naming a field in the first place.
     */
    fields: {
      type:    Array,
      default: () => []
    },

    /**
     * ViewField[] - the subset worth offering, when it is narrower than `fields`.
     *
     * Server side the api filters only on the fields it indexes and drops terms naming the rest.
     * Suggesting one of those would be handing someone a term the list then has to report it
     * ignored. Defaults to `fields`.
     */
    filterFields: {
      type:    Array,
      default: null
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
      /**
       * True when the list has been dismissed with Escape. Kept apart from `focused` so that
       * dismissing it does not take the caret out of the box - the query is still being written,
       * and the next keystroke brings the list back.
       */
      dismissed:    false,
      /** Whether the pointer is over the box, which is when the clear is offered */
      hovered:      false,
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
       * What the menu has to outrank to be seen. The stylesheet holds the floor, so 0 here
       * means nothing the box sits in claims a layer worth clearing.
       *
       * The menu hangs off <body>, so it layers against whatever else is there - and a slide-in
       * panel puts itself at 102, above the whole of the product's z-index scale. Read at the
       * moment the menu opens rather than assumed, so it stays above whatever it is opened over.
       */
      menuZ:    0,
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

  created() {
    this.uid = `${ uid++ }`;
  },

  computed: {
    /**
     * The list's own id, so the box can point at it.
     *
     * Per instance: more than one of these can be on a page, and two listboxes sharing an id
     * would have the box pointing at whichever the browser found first.
     */
    menuId() {
      return `table-view-query-menu-${ this.uid }`;
    },

    /** The option the keyboard is on, which is what the box reports as its active descendant */
    activeDescendantId() {
      return this.showSuggestions ? this.optionId(this.activeIndex) : undefined;
    },

    /**
     * What a screen reader is told when the list opens or moves.
     *
     * A combobox announces its active option on its own, but not that a list appeared or how
     * long it is - which is the part that tells someone there is anything to arrow through.
     */
    suggestionsAnnouncement() {
      if (!this.showSuggestions) {
        return '';
      }

      return this.t('tableViews.query.suggestionsAvailable', { count: this.suggestions.length }, true);
    },

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
     * The token the caret is following, which is what decides whether a joining word can go here.
     * The one the caret is inside does not count - that is the word being typed.
     */
    precedingToken() {
      const active = this.activeToken;

      const before = scanQuery(this.value || '', this.fields)
        .filter((token) => token.end <= this.caret && (!active || token.start !== active.start));

      return before[before.length - 1] || null;
    },

    /**
     * `and`, `or` and `not`, offered only where they would read.
     *
     * `not` negates whatever comes next, so it can open a query or follow a joining word, and it
     * can follow a finished term too - that is the implicit `and` with the next term left out.
     * `and` and `or` join two terms, so they need a finished one behind them. Nothing joins onto
     * a `not` that is still waiting for its term, and nothing joins onto a value being typed.
     */
    connectiveSuggestions() {
      const { negate, field, typed } = this.parsedToken;

      // Mid-value, or mid `-term`: a joining word is not what comes next
      if (field || negate) {
        return [];
      }

      const previous = this.precedingToken;
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
        .filter((word) => word.includes(needle))
        .map((word) => ({
          key:        `connective:${ word }`,
          label:      word,
          detail:     this.t(`tableViews.query.connective.${ word }`),
          insert:     `${ word } `,
          connective: true,
        }));
    },

    /**
     * Whether to offer the clear in place of the lens.
     *
     * Only under the pointer: the mark is there to be reached for, and standing in the box for
     * the whole time a query is being written it was one more thing to read past. The keyboard
     * is not left without a way out - Escape empties the box, which is why this can be a
     * pointer-only affordance rather than something that has to stay reachable by Tab.
     */
    showClear() {
      return !!this.value && this.hovered;
    },

    /** The fields offered by name, which can be narrower than the ones a query may mention */
    suggestableFields() {
      return this.filterFields || this.fields;
    },

    suggestions() {
      const { negate, field, typed } = this.parsedToken;
      const needle = typed.toLowerCase();

      if (field) {
        // A field this list cannot be filtered by gets nothing offered for it either. The api
        // has no values to give for one, so the fallback is a scan of the page in front of us -
        // which would be offering real-looking values for a term that is then thrown away.
        if (!this.suggestableFields.some((f) => f.id === field.id)) {
          return [];
        }

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

      return this.connectiveSuggestions.concat(this.suggestableFields
        .filter((f) => f.id.toLowerCase().includes(needle) || f.label.toLowerCase().includes(needle))
        .slice(0, 20)
        .map((f) => ({
          key:    f.id,
          label:  f.isLabel ? `${ LABEL_FIELD_PREFIX }${ f.label }` : f.id,
          detail: f.isLabel ? this.t('tableViews.query.label') : f.label,
          // A field on its own gets no connective - there is nothing to join until it has a value
          insert: `${ negate }${ f.id }:`,
          field:  f,
        })));
    },

    /**
     * The same suggestions, split into the runs the list draws a rule between: the words that
     * join terms, the table's own columns, and the labels its rows carry.
     *
     * Split where the kind changes rather than sorted into buckets, so the list is shown in the
     * order `suggestions` built it and a rule only ever appears where one run really ends.
     * Each entry keeps its position in the flat list, which is what the keyboard moves through.
     */
    suggestionGroups() {
      const kindOf = (suggestion) => {
        if (suggestion.connective) {
          return 'joiner';
        }

        return suggestion.field?.isLabel ? 'label' : 'field';
      };

      const groups = [];
      let current = null;

      this.suggestions.forEach((suggestion, index) => {
        const kind = kindOf(suggestion);

        if (!current || current.kind !== kind) {
          current = { kind, entries: [] };
          groups.push(current);
        }

        current.entries.push({ ...suggestion, index });
      });

      return groups;
    },

    /** Changes exactly when the list's contents do, and not when it is merely rebuilt */
    suggestionsKey() {
      return this.suggestions.map((suggestion) => suggestion.key).join('\u0000');
    },

    showSuggestions() {
      return this.focused && !this.dismissed && !!this.suggestions.length;
    },

    menuStyle() {
      // Width is left to the stylesheet: the menu is as wide as its entries need, not as wide as
      // the box it hangs under. Only where it sits comes from the box.
      return {
        top:                  `${ this.menuPos.top }px`,
        left:                 `${ this.menuPos.left }px`,
        '--query-menu-stack': this.menuZ,
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

    /**
     * Back to the top when the list itself changes.
     *
     * Keyed on what is in the list rather than on the array: `suggestions` is a computed, so it
     * hands back a new array whenever anything it reads changes - the caret included. Watching
     * the array meant the first arrow key moved the caret, rebuilt an identical list, and reset
     * the cursor it had just moved.
     */
    suggestionsKey() {
      this.activeIndex = 0;
      // A different list is a different width, and the width is what decides how far right it
      // is allowed to sit
      this.repositionMenu();
    },

    /** The list follows the caret, so it moves for an arrow key as much as for a keystroke */
    caret() {
      this.repositionMenu();
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
    // Capture, so it is seen before the browser decides what the press means
    document.addEventListener('mousedown', this.onOutsideMouseDown, true);
  },

  beforeUnmount() {
    document.removeEventListener('mousedown', this.onOutsideMouseDown, true);
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

    /**
     * Where the caret is on screen, for the list to hang under.
     *
     * A collapsed range does not always have a rect of its own - sitting at the very start of a
     * text node, or in an element with no text in it yet, browsers hand back nothing at all - so
     * the box's own left edge stands in, which is where the caret is in exactly those cases.
     */
    caretLeft() {
      const root = this.$refs.input;

      if (!root) {
        return null;
      }

      const selection = window.getSelection();

      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0);

        if (root.contains(range.startContainer)) {
          const rect = range.getBoundingClientRect();

          // An empty rect is the browser declining to place the range, not a caret at the
          // window's corner
          if (rect && (rect.left || rect.top)) {
            return rect.left;
          }
        }
      }

      return root.getBoundingClientRect().left;
    },

    updateMenuPos() {
      const rect = this.$el?.getBoundingClientRect?.();

      if (rect) {
        // The list is as wide as its entries, which is only known once it has been rendered -
        // until then the narrowest it is allowed to be is the closest guess there is
        const width = this.$refs.menu?.getBoundingClientRect().width || MENU_MIN_WIDTH;
        // Following the caret walks the list towards the right-hand edge, so it stops short of
        // it rather than hanging off the page
        const rightmost = Math.max(MENU_VIEWPORT_MARGIN, window.innerWidth - width - MENU_VIEWPORT_MARGIN);

        const at = (this.caretLeft() ?? rect.left) - MENU_TEXT_INSET;

        this.menuPos = {
          top:   rect.bottom + 2,
          left:  Math.min(Math.max(at, MENU_VIEWPORT_MARGIN), rightmost),
          width: rect.width
        };
      }

      this.menuZ = this.stackAbove();
    },

    /**
     * The z-index the menu needs to be seen from where the box is.
     *
     * Everything the box sits inside that layers itself, taken together: the highest of them is
     * what the menu has to beat, because the menu is a sibling of the lot of them down on <body>.
     * Zero when nothing along the way claims a layer, which leaves the stylesheet to say.
     */
    stackAbove() {
      let el = this.$el?.parentElement;
      let highest = 0;

      while (el && el !== document.documentElement) {
        const z = parseInt(getComputedStyle(el).zIndex, 10);

        if (!isNaN(z) && z > highest) {
          highest = z;
        }

        el = el.parentElement;
      }

      return highest ? highest + 1 : 0;
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

      // Escape puts the list away; writing more of the query is asking for it again
      this.dismissed = false;

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

      if (!root) {
        return;
      }

      const current = this.value || '';
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

      // Where the paste lands. The selection is only worth measuring when it is actually in this
      // box: a selection left elsewhere on the page - which is exactly what copying something
      // else leaves behind - measured against this box gives an offset that means nothing here.
      // The browser's own paste is already prevented by then, so nothing arrived at all and the
      // box looked like it would not take a paste. Falling back to the caret this box tracks is
      // what it does the rest of the time anyway.
      let start = Math.min(this.caret ?? current.length, current.length);
      let end = start;

      if (range && root.contains(range.startContainer) && root.contains(range.endContainer)) {
        const before = range.cloneRange();

        before.selectNodeContents(root);
        before.setEnd(range.startContainer, range.startOffset);

        start = before.toString().length;
        end = start + range.toString().length;
      }

      const next = `${ current.substring(0, start) }${ flat }${ current.substring(end) }`;

      this.pendingCaret = start + flat.length;
      // Written by us, so the box is the stale one and has to be redrawn
      this.domAhead = false;
      this.$emit('update:value', next);
    },

    onFocus() {
      this.focused = true;
      this.dismissed = false;
      this.$emit('update:focused', true);
    },

    /**
     * Clicking into the box is asking for the list as much as typing is, so a dismissed one
     * comes back
     */
    onClick() {
      this.dismissed = false;
      this.syncCaret();
    },

    /**
     * A press anywhere but on the box puts the list away - and, where the browser would have
     * handed us the caret anyway, is refused outright.
     *
     * Chrome answers a press that lands on no text of its own by looking for the nearest
     * editable position underneath it, and inside the toolbar the only one is this box. That is
     * why clicking the empty band above or below the row was landing in the query. Only
     * ancestors are refused: anything else the pointer can reach is a thing in its own right and
     * is left to do whatever it does.
     */
    onOutsideMouseDown(event) {
      const root = this.$el;
      const target = event.target;

      if (!root || !target || root.contains(target) || this.$refs.menu?.contains?.(target)) {
        return;
      }

      if (target.contains?.(root)) {
        event.preventDefault();
      }

      this.focused = false;
      this.$emit('update:focused', false);

      if (document.activeElement === this.$refs.input) {
        this.$refs.input.blur();
      }
    },

    onBlur() {
      // Let a click on a suggestion land before the list goes away, then only stand down if the
      // box really did lose focus - a blur it comes straight back from would otherwise close the
      // suggestions while the user is still typing into them
      setTimeout(() => {
        if (document.activeElement !== this.$refs.input) {
          this.focused = false;
          this.$emit('update:focused', false);
        }
      }, 150);
    },

    onKeyDown(event) {
      // One line only - Enter picks a suggestion, it never breaks the query in two
      if (event.key === 'Enter') {
        event.preventDefault();
      }

      if (!this.showSuggestions) {
        // With no list open, Escape has the box itself to act on
        if (event.key === 'Escape' && this.value) {
          event.preventDefault();
          this.clear();
        }

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
        this.dismissed = true;
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
      const value = this.value || '';
      const next = replaceToken(value, token, suggestion.insert, this.caret);

      // Where the caret belongs once it is written: over a token, just past what replaced it.
      // Spliced at the caret instead, it moves by however much longer the query got - which
      // counts the space replaceToken adds when the caret was not already following one.
      this.pendingCaret = token ? token.start + suggestion.insert.length : this.caret + (next.length - value.length);
      // Written by us, so the box is the stale one and has to be redrawn
      this.domAhead = false;
      this.$emit('update:value', next);
      this.focus();
    },

    /**
     * Empty the box, for the clear button and for Escape.
     *
     * `dismissed` is deliberately left as it is. Escape has already put the list away by the time
     * it gets here, and reopening it on the same key the user pressed to close things would be
     * arguing with them - while clearing by the button was never a dismissal, so the list comes
     * back the way it does for any other empty box.
     */
    clear() {
      this.pendingCaret = 0;
      // Written by us, so the box is the stale one and has to be redrawn
      this.domAhead = false;
      this.$emit('update:value', '');
      this.focus();
    },

    /** Put the list back under the caret, once whatever moved it has been rendered */
    repositionMenu() {
      if (this.showSuggestions) {
        this.$nextTick(() => this.updateMenuPos());
      }
    },

    optionId(index) {
      return `${ this.menuId }-option-${ index }`;
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
