<script setup lang="ts">
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import WidgetHost from './widgets/WidgetHost.vue';
import {
  GRID_COLUMNS, DEFAULT_GAP, cssSize, cssSides, normalizeSides, clampSpan
} from '../templating/view-model';
import { useViewEditor } from '../composables/viewEditor';
import { useWidgetPresence } from '../composables/useWidgetPresence';
import type { WidgetNode } from '../templating/types';

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

/** A box's four sides in px, as measured. */
interface Measured { top: number; right: number; bottom: number; left: number }

const props = withDefaults(defineProps<{
  node: WidgetNode;
  editing?: boolean;
  selected?: boolean;
  /** The gap between widgets — one value for the whole VIEW. */
  gap?: number;
}>(), {
  editing:  false,
  selected: false,
  gap:      DEFAULT_GAP,
});

const viewEditor = useViewEditor();
const store = useStore();
const { t } = useI18n(store);

const root = ref<HTMLElement | null>(null);
const resizing = ref(false);

// Measured margin/padding in PX. The bands cannot reuse the authored values: a band is absolutely
// positioned, so a percentage on it resolves against THIS tile, while the real margin resolves
// against the line — a col-span-3 tile would draw the band 4x too small. getComputedStyle gives the
// used value in px, which is exact for %, rem, anything.
const usedMargin = ref<Measured | null>(null);
const usedCardPadding = ref<Measured | null>(null);

const beingDragged = computed(() => viewEditor.ui.dragId === props.node.id);

// Outside the editor, a widget with nothing to show on its cluster is not drawn at all - as the
// dashboard leaves out what a cluster does not have (see useWidgetPresence).
const { present } = useWidgetPresence();
const absent = computed(() => !props.editing && !present(props.node.widget));

// A widget that holds widgets (Tabs) stays live while editing: its tabs switch, and what is in them
// is edited in place like anything else on the grid.
const holdsWidgets = computed(() => !!props.node.widget.tabs);
const span = computed(() => clampSpan(props.node.colSpan));
const margin = computed(() => normalizeSides(props.node.margin));

// The margin/padding bands answer "where do these pixels go?", which is only a question while you
// are typing pixels — so they are drawn only when the Layout tab's Advanced section is open.
const showBoxModel = computed(() => props.selected && viewEditor.ui.showBoxModel);

const style = computed<CSSProperties>(() => {
  // The span's share of a 12-column line that has a GAP between every column.
  const gaps = (GRID_COLUMNS - 1) * props.gap;
  const own = (span.value - 1) * props.gap;
  // Subtract this widget's own horizontal margins from the basis, so basis + margins is exactly the
  // span's share of the line and a margin never pushes a neighbour onto the next one.
  const subtract = [margin.value.left, margin.value.right].filter((v) => v && v !== 0).map(cssSize);
  const basis = `calc((100% - ${ gaps }px) * ${ span.value } / ${ GRID_COLUMNS } + ${ own }px${ subtract.length ? ` - ${ subtract.join(' - ') }` : '' })`;

  // PADDING is the room the content has INSIDE the card, not a ring around the widget — so it is
  // handed to the card as custom properties rather than applied here. A widget is flush in its
  // cell; only its margin and the view's gap separate it from its neighbours.
  const p = normalizeSides(props.node.padding);
  // The design's header is 12/16 — three quarters of the side inset, vertically — and its body
  // hangs straight off the header with no gap. Scaling keeps that shape at every spacing.
  const headV = Math.round(Number(p.top) * 0.75);
  const headVBottom = Math.round(Number(p.bottom) * 0.75);

  const s: CSSProperties & Record<string, string | number> = {
    boxSizing:          'border-box',
    // min-width:0 is REQUIRED: a flex item defaults to min-width:auto and so refuses to shrink below
    // its content's min-content width — a wide table would blow the line out past the page.
    flex:               `0 0 ${ basis }`,
    margin:             cssSides(props.node.margin),
    minWidth:           0,
    '--wcard-head-pad': `${ headV }px ${ cssSize(p.right) } ${ headVBottom }px ${ cssSize(p.left) }`,
    '--wcard-head-min': `${ 32 + headV + headVBottom }px`,
    '--wcard-body-pad': `0 ${ cssSize(p.right) } ${ cssSize(p.bottom) } ${ cssSize(p.left) }`,
    '--wcard-solo-pad': cssSides(props.node.padding),
  };

  const height = props.node.height;

  if (height && height !== 'auto') {
    s.height = cssSize(height);
    s.minHeight = 0;
  }

  return s;
});

// ---- box-model bands (selected widget, Advanced open) ----
// Four strips per box, sized from the real values. The MARGIN sits outside the element (negative
// offsets), the PADDING inside it. Filled, no numbers — amber for margin, green for padding.

// `outside` puts the strips beyond the element's edges (margin) rather than inside (padding).
function bandsFor(box: Measured | null, outside: boolean): CSSProperties[] {
  if (!box) {
    return [];
  }

  const px = (v: number) => `${ outside ? -v : 0 }px`;
  const out: CSSProperties[] = [];

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
}

const marginBands = computed(() => bandsFor(usedMargin.value, true));
// Padding lives on the CARD, so it is measured there rather than on this wrapper.
const paddingBands = computed(() => bandsFor(usedCardPadding.value, false));

// Read the USED margin/padding (always px, whatever unit was authored) for the band overlays.
function measure(): void {
  const el = root.value;

  if (!showBoxModel.value || !el) {
    usedMargin.value = null;
    usedCardPadding.value = null;

    return;
  }

  const n = (v: string) => Math.round((parseFloat(v) || 0) * 10) / 10;
  const cs = getComputedStyle(el);
  const card = el.querySelector('.wcard');
  const cardCs = card ? getComputedStyle(card) : null;

  usedMargin.value = {
    top: n(cs.marginTop), right: n(cs.marginRight), bottom: n(cs.marginBottom), left: n(cs.marginLeft)
  };
  usedCardPadding.value = cardCs ? {
    top: n(cardCs.paddingTop), right: n(cardCs.paddingRight), bottom: n(cardCs.paddingBottom), left: n(cardCs.paddingLeft)
  } : null;
}

function scheduleMeasure(): void {
  nextTick(measure);
}

watch(showBoxModel, scheduleMeasure, { immediate: true });
watch(() => [props.node.margin, props.node.padding, props.node.colSpan], scheduleMeasure, { deep: true });

// Re-measure when the element's own size changes (window resize, a neighbour resizing, …) so a
// percentage band keeps matching the real spacing.
let ro: ResizeObserver | null = null;

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    ro = new ResizeObserver(measure);
    ro.observe(root.value);
  }
});

onBeforeUnmount(() => {
  ro?.disconnect();
  ro = null;
});

// A widget inside a Tabs widget is inside that widget's tile too, so the click is kept from reaching
// the outer one - it would select the Tabs widget right after this one.
function onSelect(ev: MouseEvent): void {
  if (props.editing) {
    ev.stopPropagation();
    viewEditor.select(props.node.id);
  }
}

// Hand the settings this widget's position so they open beside it rather than in the middle of
// the screen — the whole point of settings "in place".
function openSettings(): void {
  const r = root.value?.getBoundingClientRect();

  viewEditor.configure(props.node.id, r ? { left: Math.round(r.left), top: Math.round(r.top) } : null);
}

// ---- drag ----
function onDragStart(ev: DragEvent): void {
  if (!props.editing) {
    return;
  }
  ev.stopPropagation();
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    // Firefox needs data set for a drag to start at all.
    ev.dataTransfer.setData('text/plain', props.node.id);
  }
  viewEditor.beginDrag(props.node.id);
}

function onDragEnd(): void {
  viewEditor.endDrag();
}

// ---- col-span resize ----
function startResize(ev: PointerEvent): void {
  if (!props.editing) {
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();
  // Selecting it makes the grid show its column guides while you drag the edge.
  viewEditor.select(props.node.id);

  const line = root.value?.parentElement;
  const colWidth = line ? line.getBoundingClientRect().width / GRID_COLUMNS : 0;

  if (!colWidth) {
    return;
  }

  const startX = ev.clientX;
  const startSpan = span.value;

  resizing.value = true;

  const onMove = (e: PointerEvent) => {
    const next = clampSpan(startSpan + Math.round((e.clientX - startX) / colWidth));

    if (next !== span.value) {
      viewEditor.setColSpan(props.node.id, next);
    }
  };

  const onUp = () => {
    resizing.value = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}
</script>

<template>
  <div
    v-show="!absent"
    ref="root"
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
      <span class="wnode__label">{{ t('configurableViews.widget.dragToMove') }}</span>
      <span class="wnode__bar-gap" />
      <button
        class="wnode__btn"
        :title="t('configurableViews.widget.settings')"
        @click.stop="openSettings"
      >
        <i class="icon icon-gear" />
      </button>
      <button
        class="wnode__btn wnode__btn--danger"
        :title="t('configurableViews.widget.remove')"
        @click.stop="viewEditor.remove(node.id)"
      >
        <i class="icon icon-close" />
      </button>
    </div>

    <div class="wnode__content">
      <WidgetHost
        :widget="node.widget"
        :node-id="node.id"
        :gap="gap"
      />
    </div>

    <!-- Makes the live widget inert while editing, so a drag starts on the tile, not inside it. -->
    <div
      v-if="editing && !holdsWidgets"
      class="wnode__shield"
    />
    <div
      v-if="editing"
      class="wnode__resize"
      :class="{ 'wnode__resize--active': resizing }"
      :title="t('configurableViews.widget.resize')"
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
    box-shadow:   0 0 0 2px color-mix(in srgb, var(--primary) 12%, transparent);
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
