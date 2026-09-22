<script>
import TemplatePanel from './TemplatePanel.vue';
import WidgetHost from './widgets/WidgetHost.vue';
import {
  NODE_WIDGET, GRID_COLUMNS, DEFAULT_GAP, cssSize, cssSides, normalizeSides, clampSpan
} from '../templating/view-model';

// ONE widget on the grid.
//
// Its width is a COLUMN SPAN: the share of a 12-column line that has a GAP between every column, so
// a span-s widget covers s columns plus the (s-1) gaps it swallows. Written out here rather than
// handed to a CSS grid because the line is a flex line — which is what lets widgets wrap into rows
// on their own, with no row objects to manage.
//
// Outside edit mode this renders SEAMLESSLY — no chrome. In edit mode it wears its own header (that
// header is how you drag it), and every piece of chrome is painted ABOVE the rendered widget, which
// is stacking-isolated so its own z-indexes — sticky table headers, dropdowns — can never cover the
// editor or steal its clicks.
export default {
  name:       'WidgetNode',
  components: { TemplatePanel, WidgetHost },

  inject: {
    viewEditor: {
      default: () => ({
        select:       () => {},
        remove:       () => {},
        configure:    () => {},
        editTemplate: () => {},
        beginDrag:    () => {},
        endDrag:      () => {},
        setColSpan:   () => {},
        ui:           { dragId: null, showBoxModel: false },
      }),
    },
  },

  props: {
    node: {
      type:     Object,
      required: true,
    },
    editing: {
      type:    Boolean,
      default: false,
    },
    selected: {
      type:    Boolean,
      default: false,
    },
    // The gap between widgets — one value for the whole VIEW.
    gap: {
      type:    Number,
      default: DEFAULT_GAP,
    },
  },

  data() {
    return {
      resizing:        false,
      // Measured margin/padding in PX. The bands can't just reuse the authored values: a band is
      // absolutely positioned, so a percentage on it resolves against THIS tile, while the real
      // margin resolves against the line — a col-span-3 tile would draw the band 4x too small.
      // getComputedStyle gives the used value in px, which is exact for %, rem, anything.
      used:            null,
      usedCardPadding: null,
    };
  },

  computed: {
    isWidget() {
      return this.node.type === NODE_WIDGET;
    },

    beingDragged() {
      return this.viewEditor.ui?.dragId === this.node.id;
    },

    span() {
      return clampSpan(this.node.colSpan);
    },

    margin() {
      return normalizeSides(this.node.margin);
    },

    // The margin/padding bands answer "where do these pixels go?", which is only a question while
    // you are typing pixels — so they are drawn only when the Layout tab's Advanced panel is open.
    showBoxModel() {
      return this.selected && !!this.viewEditor.ui?.showBoxModel;
    },

    style() {
      // The span's share of a 12-column line that has a GAP between every column.
      const gaps = (GRID_COLUMNS - 1) * this.gap;
      const own = (this.span - 1) * this.gap;
      // Subtract this widget's own horizontal margins from the basis, so basis + margins is exactly
      // the span's share of the line and a margin never pushes a neighbour onto the next one.
      const subtract = [this.margin.left, this.margin.right].filter((v) => v && v !== 0).map(cssSize);
      const basis = `calc((100% - ${ gaps }px) * ${ this.span } / ${ GRID_COLUMNS } + ${ own }px${ subtract.length ? ` - ${ subtract.join(' - ') }` : '' })`;

      // PADDING is the room the content has INSIDE the card, not a ring around the widget — so it
      // is handed to the card as custom properties rather than applied here. A widget is flush in
      // its cell; only its margin and the view's gap separate it from its neighbours.
      const p = normalizeSides(this.node.padding);
      // The design's header is 12/16 — three quarters of the side inset, vertically — and its body
      // hangs straight off the header with no gap. Scaling keeps that shape at every spacing.
      const headV = Math.round(p.top * 0.75);
      const headVBottom = Math.round(p.bottom * 0.75);

      const s = {
        boxSizing:          'border-box',
        // min-width:0 is REQUIRED: a flex item defaults to min-width:auto and so refuses to shrink
        // below its content's min-content width — a wide table would blow the line out past the page.
        flex:               `0 0 ${ basis }`,
        margin:             cssSides(this.node.margin),
        minWidth:           0,
        '--wcard-head-pad': `${ headV }px ${ p.right }px ${ headVBottom }px ${ p.left }px`,
        '--wcard-head-min': `${ 32 + headV + headVBottom }px`,
        '--wcard-body-pad': `0 ${ p.right }px ${ p.bottom }px ${ p.left }px`,
        '--wcard-solo-pad': cssSides(this.node.padding),
      };

      const height = this.node.height;

      if (height && height !== 'auto') {
        s.height = cssSize(height);
        s.minHeight = 0;
      }

      return s;
    },

    // ---- box-model bands (selected widget, Advanced open) ----
    // Four strips per box, sized from the real values. The MARGIN sits outside the element (negative
    // offsets), the PADDING inside it. Filled, no numbers — amber for margin, green for padding.
    marginBands() {
      return this.bandsFor(this.used?.margin, true);
    },

    // Padding lives on the CARD now, so measure it there rather than on this wrapper.
    paddingBands() {
      return this.bandsFor(this.usedCardPadding, false);
    },
  },

  watch: {
    showBoxModel: {
      immediate: true,
      handler() {
        this.scheduleMeasure();
      },
    },
    'node.margin': {
      deep: true,
      handler() {
        this.scheduleMeasure();
      },
    },
    'node.padding': {
      deep: true,
      handler() {
        this.scheduleMeasure();
      },
    },
    'node.colSpan'() {
      this.scheduleMeasure();
    },
  },

  mounted() {
    // Re-measure when the element's own size changes (window resize, a neighbour resizing, …) so a
    // percentage band keeps matching the real spacing.
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.measure());
      this.ro.observe(this.$el);
    }
  },

  beforeUnmount() {
    this.ro?.disconnect();
    this.ro = null;
  },

  methods: {
    // `outside` puts the strips beyond the element's edges (margin) rather than inside (padding).
    bandsFor(box, outside) {
      if (!box) {
        return [];
      }

      const px = (v) => `${ outside ? -v : 0 }px`;
      const out = [];

      if (box.top) {
        out.push({
          top: px(box.top), left: px(box.left), right: px(box.right), height: `${ box.top }px`
        });
      }
      if (box.bottom) {
        out.push({
          bottom: px(box.bottom), left: px(box.left), right: px(box.right), height: `${ box.bottom }px`
        });
      }
      if (box.left) {
        out.push({
          top: 0, bottom: 0, left: px(box.left), width: `${ box.left }px`
        });
      }
      if (box.right) {
        out.push({
          top: 0, bottom: 0, right: px(box.right), width: `${ box.right }px`
        });
      }

      return out;
    },

    scheduleMeasure() {
      this.$nextTick(() => this.measure());
    },

    // Read the USED margin/padding (always px, whatever unit was authored) for the band overlays.
    measure() {
      if (!this.showBoxModel || !this.$el?.getBoundingClientRect) {
        this.used = null;
        this.usedCardPadding = null;

        return;
      }

      const cs = getComputedStyle(this.$el);
      const n = (v) => Math.round((parseFloat(v) || 0) * 10) / 10;

      const card = this.$el.querySelector('.wcard, .wtext');
      const cardCs = card ? getComputedStyle(card) : null;

      this.used = {
        margin: {
          top: n(cs.marginTop), right: n(cs.marginRight), bottom: n(cs.marginBottom), left: n(cs.marginLeft)
        },
      };
      this.usedCardPadding = cardCs ? {
        top: n(cardCs.paddingTop), right: n(cardCs.paddingRight), bottom: n(cardCs.paddingBottom), left: n(cardCs.paddingLeft)
      } : null;
    },

    onSelect() {
      if (this.editing) {
        this.viewEditor.select(this.node.id);
      }
    },

    // Hand the settings panel this widget's position so it opens beside it rather than in the
    // middle of the screen — the whole point of settings "in place".
    openSettings() {
      if (!this.isWidget) {
        this.viewEditor.editTemplate(this.node.template);

        return;
      }

      const r = this.$el?.getBoundingClientRect?.();

      this.viewEditor.configure(this.node.id, r ? { left: Math.round(r.left), top: Math.round(r.top) } : null);
    },

    // ---- drag ----
    onDragStart(ev) {
      if (!this.editing) {
        return;
      }
      ev.stopPropagation();
      ev.dataTransfer.effectAllowed = 'move';
      // Firefox needs data set for a drag to start at all.
      ev.dataTransfer.setData('text/plain', this.node.id);
      this.viewEditor.beginDrag(this.node.id);
    },

    onDragEnd() {
      this.viewEditor.endDrag();
    },

    // ---- col-span resize ----
    startResize(ev) {
      if (!this.editing) {
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();
      // Selecting it makes the grid show its column guides while you drag the edge.
      this.viewEditor.select(this.node.id);

      const lineEl = this.$el.parentElement;
      const colWidth = lineEl ? lineEl.getBoundingClientRect().width / GRID_COLUMNS : 0;

      if (!colWidth) {
        return;
      }

      const startX = ev.clientX;
      const startSpan = this.span;

      this.resizing = true;

      const onMove = (e) => {
        const next = clampSpan(startSpan + Math.round((e.clientX - startX) / colWidth));

        if (next !== this.span) {
          this.viewEditor.setColSpan(this.node.id, next);
        }
      };

      const onUp = () => {
        this.resizing = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
  },
};
</script>

<template>
  <div
    class="wnode"
    :class="{
      'wnode--editing': editing,
      'wnode--selected': selected,
      'wnode--dragging': beingDragged,
    }"
    :style="style"
    :draggable="editing"
    :data-node-id="node.id"
    @click="onSelect"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <!-- Box model of the selected widget: amber margin outside, green padding inside. -->
    <template v-if="showBoxModel">
      <div
        v-for="(band, i) in marginBands"
        :key="`m${ i }`"
        class="wnode__band wnode__band--margin"
        :style="band"
      />
      <div
        v-for="(band, i) in paddingBands"
        :key="`p${ i }`"
        class="wnode__band wnode__band--padding"
        :style="band"
      />
    </template>

    <!-- A real overlay, not an `outline`, so the rendered widget can never cover it. -->
    <div
      v-if="editing"
      class="wnode__frame"
    />

    <!-- The widget's own header: grab it to move the widget, or reach its settings and remove. -->
    <div
      v-if="editing"
      class="wnode__bar"
    >
      <i class="wnode__grip icon icon-menu" />
      <span class="wnode__label">Drag to move</span>
      <span class="wnode__bar-gap" />
      <button
        class="wnode__btn"
        :title="isWidget ? 'What this widget shows' : `Edit this template's content`"
        @click.stop="openSettings"
      >
        <i class="icon icon-gear" />
      </button>
      <button
        class="wnode__btn wnode__btn--danger"
        title="Remove from panel"
        @click.stop="viewEditor.remove(node.id)"
      >
        <i class="icon icon-close" />
      </button>
    </div>

    <div class="wnode__content">
      <WidgetHost
        v-if="isWidget"
        :widget="node.widget"
      />
      <TemplatePanel
        v-else
        :name="node.template"
      />
    </div>

    <!-- Makes the live widget inert while editing, so a drag starts on the tile, not inside it. -->
    <div
      v-if="editing"
      class="wnode__shield"
    />
    <div
      v-if="editing"
      class="wnode__resize"
      :class="{ 'wnode__resize--active': resizing }"
      title="Drag to resize by columns"
      @pointerdown="startResize"
    />
    <div
      v-if="resizing"
      class="wnode__span"
    >
      {{ span }} / 12
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Stacking inside a widget (all above the isolated content at 0):
//   content 0 · shield 2 · bands 3 · frame 4 · resize 5 · header 6
.wnode {
  position: relative;

  &--editing {
    cursor:      grab;
    min-height:  40px;
    user-select: none;
  }

  &--dragging {
    opacity: 0.4;
  }

  // ---- frame ----
  &__frame {
    border:         1px dashed var(--primary);
    border-radius:  4px;
    inset:          0;
    pointer-events: none;
    position:       absolute;
    z-index:        4;
  }

  // The selected widget reads as selected without moving anything: a solid border of the same
  // weight, plus a soft ring, so nothing on the grid shifts by a pixel when you click it.
  &--selected > &__frame {
    border-style: solid;
    box-shadow:   0 0 0 2px var(--accent-btn);
  }

  // ---- box-model bands ----
  &__band {
    pointer-events: none;
    position:       absolute;
    z-index:        3;
  }

  &__band--margin {
    background: rgba(247, 181, 0, 0.35);
  }

  &__band--padding {
    background: rgba(0, 170, 90, 0.30);
  }

  // ---- header ----
  // A 24px strip along the top of the widget, inside its frame: grip + "Drag to move" on the left,
  // settings and remove on the right.
  // Inset by the frame's own 1px so the dashed outline stays visible AROUND the header, exactly as
  // the design draws it — the widget is one dashed rectangle with the header sitting inside it, not
  // a solid strip that cuts the outline open along the top.
  &__bar {
    align-items:   center;
    background:    var(--sortable-table-header-bg, var(--box-bg));
    border-radius: 3px 3px 0 0;
    box-sizing:    border-box;
    display:       flex;
    gap:           8px;
    height:        24px;
    left:          1px;
    padding:       0 8px;
    position:      absolute;
    right:         1px;
    top:           1px;
    z-index:       6;
  }

  &__grip {
    color:     var(--body-text);
    font-size: 16px;
  }

  &__label {
    color:         var(--muted);
    font-size:     12px;
    overflow:      hidden;
    text-overflow: ellipsis;
    white-space:   nowrap;
  }

  &__bar-gap {
    flex: 1 1 auto;
  }

  &__btn {
    align-items: center;
    background:  transparent;
    border:      none;
    color:       var(--body-text);
    cursor:      pointer;
    display:     flex;
    font-size:   16px;
    line-height: 1;
    min-height:  0;
    padding:     0;

    &:hover {
      color: var(--link);
    }

    &--danger:hover {
      color: var(--error);
    }
  }

  // The header sits over the widget, so push the widget itself down by exactly its height —
  // nothing is ever hidden underneath it.
  &--editing > &__content {
    padding-top: 25px;
  }

  // Traps the rendered widget's stacking context at level 0, so its own z-indexes can't cover the
  // editor chrome (and steal its clicks).
  &__content {
    height:    100%;
    isolation: isolate;
    position:  relative;
    z-index:   0;
  }

  &__shield {
    inset:    0;
    position: absolute;
    z-index:  2;
  }

  &__resize {
    bottom:   0;
    cursor:   col-resize;
    position: absolute;
    right:    0;
    top:      0;
    width:    8px;
    z-index:  5;

    &::after {
      background:    var(--border);
      border-radius: 2px;
      bottom:        6px;
      content:       '';
      position:      absolute;
      right:         2px;
      top:           6px;
      width:         3px;
    }

    &:hover::after,
    &--active::after {
      background: var(--primary);
    }
  }

  &__span {
    background:     var(--primary);
    border-radius:  var(--border-radius);
    bottom:         6px;
    color:          var(--primary-text);
    font-size:      11px;
    font-weight:    600;
    padding:        2px 6px;
    pointer-events: none;
    position:       absolute;
    right:          10px;
    z-index:        6;
  }
}
</style>
