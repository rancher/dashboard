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
import type { GridCell } from '../templating/grid-layout';
import { useViewEditor, type WidgetResize } from '../composables/viewEditor';
import { useWidgetPresence } from '../composables/useWidgetPresence';
import type { Sides, WidgetNode } from '../templating/types';

// ONE widget on the grid.
//
// It is placed on the CELLS the grid works out for it (see grid-layout): its line, the column it
// starts at and its COLUMN SPAN - s columns plus the (s-1) gaps it swallows. Its margin sits inside
// those cells, so a margin never pushes a neighbour along.
//
// Outside edit mode this renders SEAMLESSLY — no chrome. In edit mode it wears its own header (that
// header is how you drag it), and every piece of chrome is painted ABOVE the rendered widget, which
// is stacking-isolated so its own z-indexes — sticky table headers, dropdowns — can never cover the
// editor or steal its clicks.

/** One strip of the padding band, and the side it stands for. */
interface Band { side: keyof Sides; style: CSSProperties }

const props = withDefaults(defineProps<{
  node: WidgetNode;
  /** Where the grid puts it. */
  cell?: GridCell | null;
  editing?: boolean;
  selected?: boolean;
  /** A drop being dragged over the grid would move it over to make room. */
  shifting?: boolean;
  /** The gap between widgets — one value for the whole VIEW. */
  gap?: number;
}>(), {
  cell:     null,
  editing:  false,
  selected: false,
  shifting: false,
  gap:      DEFAULT_GAP,
});

const viewEditor = useViewEditor();
const store = useStore();
const { t } = useI18n(store);

const root = ref<HTMLElement | null>(null);
/** The edge being dragged, if one is. */
const resizing = ref<'' | 'start' | 'end' | 'bottom'>('');

/** The padding bands, placed over the card that carries the padding (see measurePadding). */
const paddingBands = ref<Band[]>([]);

const beingDragged = computed(() => viewEditor.ui.dragId === props.node.id);

// Outside the editor, a widget with nothing to show on its cluster is not drawn at all - as the
// dashboard leaves out what a cluster does not have (see useWidgetPresence).
const { present } = useWidgetPresence();
const absent = computed(() => !props.editing && !present(props.node.widget));

// A widget that holds widgets (Tabs) stays live while editing: its tabs switch, and what is in them
// is edited in place like anything else on the grid.
const holdsWidgets = computed(() => !!props.node.widget.tabs);
const span = computed(() => clampSpan(props.node.colSpan));

// The padding band answers "where do these pixels go?", so it is drawn for a moment after the
// spacing changes, not all the time.
const showBoxModel = computed(() => props.selected && viewEditor.ui.flashBox === 'padding');

const style = computed<CSSProperties>(() => {
  const cell = props.cell;

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
    gridColumn:         cell ? `${ cell.col + 1 } / span ${ cell.span }` : `span ${ span.value }`,
    margin:             cssSides(props.node.margin),
    // min-width:0 is REQUIRED: a grid item defaults to min-width:auto and so refuses to shrink below
    // its content's min-content width — a wide table would blow the line out past the page.
    minWidth:           0,
    '--wcard-head-pad': `${ headV }px ${ cssSize(p.right) } ${ headVBottom }px ${ cssSize(p.left) }`,
    '--wcard-head-min': `${ 32 + headV + headVBottom }px`,
    '--wcard-body-pad': `0 ${ cssSize(p.right) } ${ cssSize(p.bottom) } ${ cssSize(p.left) }`,
    '--wcard-solo-pad': cssSides(props.node.padding),
  };

  if (cell) {
    s.gridRow = `${ cell.line + 1 }`;
  }

  const height = props.node.height;

  if (height && height !== 'auto') {
    s.height = cssSize(height);
    s.minHeight = 0;
  }

  return s;
});

// ---- the padding band (selected widget, just after its spacing changed) ----

/**
 * Padding lives on the CARD, split between its parts: the head carries the top and the sides, the
 * body the bottom - or the body alone, or a Tabs widget's panel, all four. Each side is read where
 * it is applied, and the bands are placed over the card as it sits in this widget, below the
 * editor's "Drag to move" strip.
 */
function measurePadding(el: HTMLElement): Band[] {
  const box = el.querySelector<HTMLElement>('.wcard, .wtabs__panel');

  if (!box) {
    return [];
  }

  const n = (v: string) => Math.round((parseFloat(v) || 0) * 10) / 10;
  const head = box.querySelector<HTMLElement>(':scope > .wcard__head');
  const body = box.querySelector<HTMLElement>(':scope > .wcard__body');
  const sides = getComputedStyle(head || body || box);
  const ends = getComputedStyle(body || box);
  const top = n(sides.paddingTop);
  const bottom = n(ends.paddingBottom);
  const left = n(sides.paddingLeft);
  const right = n(sides.paddingRight);

  const outer = el.getBoundingClientRect();
  const r = box.getBoundingClientRect();
  const x = r.left - outer.left;
  const y = r.top - outer.top;
  const px = (v: number) => `${ v }px`;
  const out: Band[] = [];

  if (top) {
    out.push({
      side:  'top',
      style: {
        top: px(y), left: px(x), width: px(r.width), height: px(top)
      },
    });
  }
  if (bottom) {
    out.push({
      side:  'bottom',
      style: {
        top: px(y + r.height - bottom), left: px(x), width: px(r.width), height: px(bottom)
      },
    });
  }
  if (left) {
    out.push({
      side:  'left',
      style: {
        top: px(y), left: px(x), width: px(left), height: px(r.height)
      },
    });
  }
  if (right) {
    out.push({
      side:  'right',
      style: {
        top: px(y), left: px(x + r.width - right), width: px(right), height: px(r.height)
      },
    });
  }

  return out;
}

// Read the USED padding (always px, whatever unit was authored) for the band.
function measure(): void {
  const el = root.value;

  paddingBands.value = showBoxModel.value && el ? measurePadding(el) : [];
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

  // Where it was picked up stays under the pointer, so the drop lands where the widget is seen to be.
  const r = root.value?.getBoundingClientRect();

  viewEditor.beginDrag(props.node.id, r ? ev.clientX - r.left : undefined);
}

function onDragEnd(): void {
  viewEditor.endDrag();
}

// ---- resizing by an edge ----
// The right edge sets the span, the left edge where it starts (its right edge staying put), the
// bottom its height. Widths snap to the columns; heights to HEIGHT_STEP px.
const HEIGHT_STEP = 10;
const MIN_HEIGHT = 60;

// The badge shown while resizing: columns for a width, px for a height.
const resizeBadge = computed(() => {
  if (resizing.value === 'bottom') {
    return cssSize(props.node.height);
  }

  return `${ span.value } / ${ GRID_COLUMNS }`;
});

function startResize(ev: PointerEvent, edge: 'start' | 'end' | 'bottom'): void {
  if (!props.editing) {
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();

  const grid = root.value?.parentElement;
  const box = root.value?.getBoundingClientRect();

  if (!grid || !box) {
    return;
  }

  // Column to column, gap included: twelve of these, less one gap, is the grid's width.
  const pitch = (grid.getBoundingClientRect().width + props.gap) / GRID_COLUMNS;
  const startX = ev.clientX;
  const startY = ev.clientY;
  const startSpan = span.value;
  const startCol = props.cell?.col ?? 0;
  let last = '';

  // Selecting it makes the grid show its column guides while you drag the edge.
  viewEditor.beginResize(props.node.id);
  resizing.value = edge;

  const onMove = (e: PointerEvent) => {
    const columns = Math.round((e.clientX - startX) / pitch);
    let change: WidgetResize;

    if (edge === 'end') {
      change = { span: clampSpan(startSpan + columns) };
    } else if (edge === 'start') {
      change = { start: startCol + columns };
    } else {
      change = { height: Math.max(MIN_HEIGHT, Math.round((box.height + e.clientY - startY) / HEIGHT_STEP) * HEIGHT_STEP) };
    }

    // Only when it lands somewhere new: every change re-lays the whole list.
    const key = JSON.stringify(change);

    if (key !== last) {
      last = key;
      viewEditor.resize(props.node.id, change);
    }
  };

  const onUp = () => {
    resizing.value = '';
    viewEditor.endResize();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

// Double-clicking the bottom edge lets the content decide the height again.
function fitHeight(): void {
  if (props.editing) {
    viewEditor.beginResize(props.node.id);
    viewEditor.resize(props.node.id, { height: 'auto' });
    viewEditor.endResize();
  }
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
      'wnode--shifting': shifting,
    }"
    :style="style"
    :draggable="editing"
    :data-node-id="node.id"
    @click="onSelect"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <!-- The selected widget's padding, lit green as it changes -->
    <template v-if="showBoxModel">
      <div
        v-for="band in paddingBands"
        :key="`p-${ band.side }`"
        class="wnode__band wnode__band--padding"
        :style="band.style"
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
    <template v-if="editing">
      <div
        class="wnode__resize wnode__resize--start"
        :class="{ 'wnode__resize--active': resizing === 'start' }"
        :title="t('configurableViews.widget.resizeStart')"
        data-testid="configurable-views-resize-start"
        @pointerdown="startResize($event, 'start')"
      />
      <div
        class="wnode__resize wnode__resize--end"
        :class="{ 'wnode__resize--active': resizing === 'end' }"
        :title="t('configurableViews.widget.resize')"
        data-testid="configurable-views-resize-end"
        @pointerdown="startResize($event, 'end')"
      />
      <div
        class="wnode__resize wnode__resize--bottom"
        :class="{ 'wnode__resize--active': resizing === 'bottom' }"
        :title="t('configurableViews.widget.resizeHeight')"
        data-testid="configurable-views-resize-bottom"
        @pointerdown="startResize($event, 'bottom')"
        @dblclick.stop="fitHeight"
      />
    </template>
    <div
      v-if="resizing"
      class="wnode__span"
      :class="{ 'wnode__span--height': resizing === 'bottom' }"
    >
      {{ resizeBadge }}
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

  // A drop over the grid would move it over: say so before it happens.
  &--shifting > .wnode__frame {
    border:     2px dashed var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
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
  // Kept to its cells: a widget wider than them - a table with many columns in a narrow tile, or in
  // a tab - scrolls sideways inside itself rather than running over its neighbours.
  &__content {
    height:     100%;
    isolation:  isolate;
    overflow-x: auto;
    overflow-y: hidden;
    position:   relative;
    z-index:    0;
  }

  &__shield {
    inset:    0;
    position: absolute;
    z-index:  2;
  }

  // The edges you drag to resize: left and right by columns, bottom by height.
  &__resize {
    position: absolute;
    z-index:  5;

    &::after {
      background:    var(--border);
      border-radius: 2px;
      content:       '';
      position:      absolute;
    }

    &:hover::after,
    &--active::after {
      background: var(--primary);
    }

    &--start,
    &--end {
      bottom: 0;
      cursor: col-resize;
      top:    0;
      width:  8px;

      &::after {
        bottom: 6px;
        top:    6px;
        width:  3px;
      }
    }

    &--start {
      left: 0;

      &::after {
        left: 2px;
      }
    }

    &--end {
      right: 0;

      &::after {
        right: 2px;
      }
    }

    // Straddles the bottom edge - 12px in, 12px out into the gap - so it is caught without aiming
    // for a hairline. The bar you see stays on the widget.
    &--bottom {
      bottom: -12px;
      cursor: row-resize;
      height: 24px;
      left:   8px;
      right:  8px;

      &::after {
        bottom: 14px;
        height: 3px;
        left:   calc(50% - 20px);
        width:  40px;
      }
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

    &--height {
      bottom: 12px;
      right:  calc(50% - 24px);
    }
  }
}
</style>
