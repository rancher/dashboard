<script>
import WidgetNode from './WidgetNode.vue';
import { GRID_COLUMNS, DEFAULT_GAP } from '../templating/view-model';

// While a drag is in flight the browser does not scroll the page for you, so a drop target below
// the fold is simply unreachable — you cannot scroll with the pointer held down. These drive an
// edge-scroll: come within EDGE px of the top or bottom and the page moves, faster the closer you
// get, until the pointer leaves the zone or the drag ends.
const EDGE = 90;
const MAX_SPEED = 22;

// The grid: a view's widgets, in order, wrapping onto lines.
//
// It is ONE flex container, not a tree. A widget takes its span's share of a 12-column line and
// wraps when there is no room left, which is what makes rows an emergent property of the widths
// rather than objects anyone has to manage. There is exactly one drop target — the list — and a
// drop resolves to an INDEX in it.
export default {
  name:       'WidgetGrid',
  components: { WidgetNode },

  inject: {
    viewEditor: {
      default: () => ({
        dropAt: () => {},
        ui:     {
          dragId: null, dragEntry: null, dragLabel: ''
        },
      }),
    },
  },

  props: {
    widgets: {
      type:    Array,
      default: () => [],
    },
    editing: {
      type:    Boolean,
      default: false,
    },
    selectedId: {
      type:    String,
      default: '',
    },
    gap: {
      type:    Number,
      default: DEFAULT_GAP,
    },
  },

  data() {
    return { dropIndex: -1, scrollTimer: null };
  },

  computed: {
    columns() {
      return GRID_COLUMNS;
    },

    // Something is on its way onto the grid: a widget already on it being moved, or a catalog entry
    // being dragged in from the drawer. Both light up the drop targets.
    dragActive() {
      const ui = this.viewEditor.ui;

      return this.editing && !!(ui?.dragId || ui?.dragEntry);
    },

    style() {
      return {
        alignContent: 'flex-start',
        alignItems:   'flex-start',
        display:      'flex',
        flexWrap:     'wrap',
        gap:          `${ this.gap }px`,
      };
    },

    // The guide overlay is its own 12-track grid, so the lines always mark exact twelfths.
    guideStyle() {
      return {
        display:             'grid',
        gap:                 `${ this.gap }px`,
        gridTemplateColumns: `repeat(${ GRID_COLUMNS }, minmax(0, 1fr))`,
      };
    },

    // Column guides are only meaningful while you are placing or sizing something.
    showGuides() {
      return this.editing && (this.dragActive || !!this.selectedId);
    },

    // What the end-of-grid drop target invites you to do. While something is being dragged it names
    // it ("Drop here to add a Table") so the target is unmistakable.
    dropHint() {
      const label = this.viewEditor.ui?.dragLabel;

      return label ? `Drop here to add a ${ label }` : 'Drop a component here';
    },
  },

  mounted() {
    // A drag that ends anywhere — including outside the grid, or cancelled with Escape — must stop
    // the page scrolling. dragend fires on the source, so listen for it globally.
    this.onAnyDragEnd = () => this.stopScrolling();
    document.addEventListener('dragend', this.onAnyDragEnd);
    document.addEventListener('drop', this.onAnyDragEnd);
  },

  beforeUnmount() {
    this.stopScrolling();
    document.removeEventListener('dragend', this.onAnyDragEnd);
    document.removeEventListener('drop', this.onAnyDragEnd);
  },

  methods: {
    /**
     * Where a drop would land: compare the pointer with each widget's box. Widgets wrap, so a
     * widget counts as "before the pointer" when it is on an earlier line, or on the same line and
     * left of the pointer — reading order, exactly as the list is ordered.
     */
    computeDropIndex(ev) {
      const zone = this.$refs.body;

      if (!zone) {
        return 0;
      }

      const tiles = Array.from(zone.children).filter((el) => el.dataset && el.dataset.nodeId);

      for (let i = 0; i < tiles.length; i++) {
        const r = tiles[i].getBoundingClientRect();

        if (ev.clientY < r.top) {
          return i;
        }
        if (ev.clientY <= r.bottom && ev.clientX < r.left + (r.width / 2)) {
          return i;
        }
      }

      return tiles.length;
    },

    // ---- edge scrolling while dragging ----

    /** The scroller the page actually uses — Rancher scrolls a main element, not the window. */
    scroller() {
      if (this.scrollEl !== undefined) {
        return this.scrollEl;
      }

      let el = this.$el?.parentElement;

      while (el && el !== document.body) {
        const style = getComputedStyle(el);

        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
          this.scrollEl = el;

          return el;
        }
        el = el.parentElement;
      }

      this.scrollEl = null;

      return null;
    },

    // How fast to scroll for a pointer at `y`: 0 outside the edge zones, ramping to MAX_SPEED at
    // the very edge, negative for up.
    edgeSpeed(y) {
      const top = this.scrollTop();
      const bottom = this.scrollBottom();

      if (y < top + EDGE) {
        return -Math.ceil(((top + EDGE - y) / EDGE) * MAX_SPEED);
      }
      if (y > bottom - EDGE) {
        return Math.ceil(((y - (bottom - EDGE)) / EDGE) * MAX_SPEED);
      }

      return 0;
    },

    scrollTop() {
      const el = this.scroller();

      return el ? el.getBoundingClientRect().top : 0;
    },

    scrollBottom() {
      const el = this.scroller();

      return el ? el.getBoundingClientRect().bottom : window.innerHeight;
    },

    autoScroll(y) {
      const speed = this.edgeSpeed(y);

      this.stopScrolling();

      if (!speed) {
        return;
      }

      const el = this.scroller();

      this.scrollTimer = setInterval(() => {
        if (el) {
          el.scrollTop += speed;
        } else {
          window.scrollBy(0, speed);
        }
      }, 16);
    },

    stopScrolling() {
      if (this.scrollTimer) {
        clearInterval(this.scrollTimer);
        this.scrollTimer = null;
      }
    },

    // ---- drag & drop ----

    onDragOver(ev) {
      if (!this.dragActive) {
        return;
      }
      ev.preventDefault();
      ev.dataTransfer.dropEffect = this.viewEditor.ui?.dragEntry ? 'copy' : 'move';
      this.dropIndex = this.computeDropIndex(ev);
      this.autoScroll(ev.clientY);
    },

    onDragLeave(ev) {
      // Ignore bubbling leaves from children still inside the grid.
      if (this.$el.contains(ev.relatedTarget)) {
        return;
      }
      this.dropIndex = -1;
      this.stopScrolling();
    },

    onDrop(ev) {
      if (!this.editing) {
        return;
      }
      ev.preventDefault();

      const index = this.dropIndex >= 0 ? this.dropIndex : this.computeDropIndex(ev);

      this.dropIndex = -1;
      this.stopScrolling();
      this.viewEditor.dropAt(index);
    },

    onDropAtEnd(ev) {
      if (!this.editing) {
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();
      this.dropIndex = -1;
      this.stopScrolling();
      this.viewEditor.dropAt(this.widgets.length);
    },
  },
};
</script>

<template>
  <div
    class="wgrid"
    :class="{ 'wgrid--editing': editing }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div
      ref="body"
      class="wgrid__body"
      :style="style"
    >
      <div
        v-if="showGuides"
        class="wgrid__guides"
        :class="{ 'wgrid__guides--active': dragActive }"
        :style="guideStyle"
        aria-hidden="true"
      >
        <span
          v-for="c in columns"
          :key="c"
        />
      </div>

      <template
        v-for="(widget, i) in widgets"
        :key="widget.id"
      >
        <div
          v-if="dropIndex === i"
          class="wgrid__drop"
        />
        <WidgetNode
          :node="widget"
          :editing="editing"
          :selected="widget.id === selectedId"
          :gap="gap"
        />
      </template>
      <div
        v-if="dropIndex >= widgets.length"
        class="wgrid__drop"
      />
    </div>

    <!-- The end of the grid is always a place to drop into. It is a target, not a widget: nothing
       is stored for it, and it disappears the moment you stop editing. -->
    <div
      v-if="editing"
      class="wgrid__end"
      :class="{ 'wgrid__end--active': dragActive }"
      :style="{ marginTop: `${ gap }px` }"
      @dragover.prevent
      @drop="onDropAtEnd"
    >
      {{ dropHint }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wgrid {
  &__body {
    min-width: 0;
    position:  relative; // anchors the column guides to the grid's content box
  }

  &__guides {
    inset:          0;
    pointer-events: none;
    position:       absolute;
    z-index:        0;

    span {
      border-left: 1px dashed var(--border);

      &:last-child {
        border-right: 1px dashed var(--border);
      }
    }

    &--active span {
      border-color: var(--primary);
    }
  }

  // Insertion marker shown while dragging.
  &__drop {
    background:    var(--primary);
    border-radius: 2px;
    flex:          0 0 3px;
    align-self:    stretch;
    min-height:    40px;
    z-index:       2;
  }

  // The tinted, dashed panel at the end of the grid.
  &__end {
    align-items:     center;
    background:      var(--accent-btn);
    border:          2px dashed var(--primary);
    border-radius:   4px;
    box-sizing:      border-box;
    color:           var(--primary);
    display:         flex;
    font-size:       14px;
    justify-content: center;
    min-height:      78px;
    text-align:      center;
  }
}
</style>
