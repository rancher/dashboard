<script setup lang="ts">
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties
} from 'vue';
import WidgetNode from './WidgetNode.vue';
import {
  GRID_COLUMNS, DEFAULT_GAP, canPlace, clampSpan, newWidgetNode
} from '../templating/view-model';
import {
  gridCells, gridLines, dropInto, liftFrom, type DropTarget
} from '../templating/grid-layout';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useViewEditor, placeKey } from '../composables/viewEditor';
import { useWidgetPresence } from '../composables/useWidgetPresence';
import type { WidgetNode as WidgetNodeSpec, WidgetPlace } from '../templating/types';

// The grid: a view's widgets, in order, on the lines they wrap into.
//
// It is ONE CSS grid of twelve columns, not a tree. Where each widget sits - its line, the column it
// starts at, its span - is worked out by grid-layout from the list, and the widget is placed on
// exactly those cells. A drop resolves to a column on a line (a DropTarget), so a widget lands where
// it was let go; while it is over the grid, a ghost shows where that is, and the widgets it would
// push aside are marked.
//
// A Tabs widget draws one of these per tab, with the tab as its `place`. A drag over the inner grid
// is the inner grid's, and goes no further; one it will not take (a Tabs widget, which a tab cannot
// hold) is left to bubble to the grid around it.

// While a drag is in flight the browser does not scroll the page for you, so a drop target below
// the fold is simply unreachable — you cannot scroll with the pointer held down. These drive an
// edge-scroll: come within EDGE px of the top or bottom and the page moves, faster the closer you
// get, until the pointer leaves the zone or the drag ends.
const EDGE = 90;
const MAX_SPEED = 22;

const props = withDefaults(defineProps<{
  widgets?: WidgetNodeSpec[];
  editing?: boolean;
  selectedId?: string | null;
  gap?: number;
  /** The tab this grid is, inside a Tabs widget; null for the view's own grid. */
  place?: WidgetPlace | null;
  /** Light the gaps between the widgets, as the gap setting changes. */
  flashGap?: boolean;
}>(), {
  widgets:    () => [],
  editing:    false,
  selectedId: '',
  gap:        DEFAULT_GAP,
  place:      null,
  flashGap:   false,
});

const viewEditor = useViewEditor();
const store = useStore();
const { t } = useI18n(store);

const root = ref<HTMLElement | null>(null);
const body = ref<HTMLElement | null>(null);
let scrollTimer: ReturnType<typeof setInterval> | null = null;

const columns = GRID_COLUMNS;

// Outside the editor a widget with nothing to show here is left out, and the ones after it close up.
const { present } = useWidgetPresence();
const shown = computed(() => (props.editing ? props.widgets : props.widgets.filter((w) => present(w.widget))));
const cells = computed(() => gridCells(shown.value));

// Something is on its way onto the grid: a widget already on it being moved, or a catalog entry
// being dragged in from the drawer. Both light up the drop targets.
const dragActive = computed(() => props.editing && !!(viewEditor.ui.dragId || viewEditor.ui.dragEntry));

// Whether what is being dragged may land here at all.
const accepts = computed(() => dragActive.value && canPlace(viewEditor.ui.dragKind, props.place));

const key = computed(() => placeKey(props.place));

// The preview belongs to the one grid the pointer is over — never to a grid it has left for a tab
// inside it, or for the grid around it.
const over = computed(() => accepts.value && viewEditor.ui.dropPlace === key.value);

// The widgets and the guide overlay share one template, so the guides mark exactly the columns a
// widget can start and end on.
const tracks = computed<CSSProperties>(() => ({
  display:             'grid',
  gap:                 `${ props.gap }px`,
  gridTemplateColumns: `repeat(${ GRID_COLUMNS }, minmax(0, 1fr))`,
}));

const style = computed<CSSProperties>(() => ({ ...tracks.value, alignItems: 'start' }));

// Column guides are only meaningful while you are placing or sizing something - and only on the grid
// that something is on: a tab's twelfths are not the view's.
const showGuides = computed(() => props.editing && (
  (accepts.value && viewEditor.ui.dropPlace === key.value) ||
  (!!props.selectedId && props.widgets.some((w) => w.id === props.selectedId))
));

// What the end-of-grid drop target invites you to do. While something is being dragged it names it
// ("Drop here to add a Table") so the target is unmistakable.
const dropHint = computed(() => {
  if (viewEditor.ui.dragLabel) {
    return t('configurableViews.grid.dropToAdd', { name: viewEditor.ui.dragLabel });
  }

  return props.place ? t('configurableViews.grid.dropInTab') : t('configurableViews.grid.dropHere');
});

// ---- where a drop lands ----

// Within this many px of a line's top or bottom edge, a drop opens a new line there rather than
// joining the line.
const NEW_LINE_ZONE = 14;
// The id the preview gives what is being dropped.
const GHOST_ID = '\u0000ghost';

/** One line as drawn: its widgets, and the band of the page it covers. */
interface LineBox {
  ids: string[];
  top: number;
  bottom: number;
}

/** The grid's left edge and the distance from one column's start to the next, in px. */
interface Frame {
  left: number;
  top: number;
  pitch: number;
}

/** The drop's landing place, in px from the grid's corner; `bar` for a new line between two. */
interface Ghost {
  left: number;
  top: number;
  width: number;
  height: number;
  bar: boolean;
}

const target = ref<DropTarget | null>(null);
const ghost = ref<Ghost | null>(null);
const shifting = ref<Set<string>>(new Set());
/** Where each widget the drop pushes aside ends up, outlined. */
const shadows = ref<Ghost[]>([]);

function frame(): Frame | null {
  const r = body.value?.getBoundingClientRect();

  return r ? {
    left: r.left, top: r.top, pitch: (r.width + props.gap) / GRID_COLUMNS
  } : null;
}

function measureLines(): LineBox[] {
  const rects = new Map<string, DOMRect>();

  for (const el of Array.from(body.value?.children || [])) {
    const id = (el as HTMLElement).dataset?.nodeId;

    if (id) {
      rects.set(id, el.getBoundingClientRect());
    }
  }

  return gridLines(shown.value).map((ids) => {
    const boxes = ids.map((id) => rects.get(id)).filter((r): r is DOMRect => !!r);

    return {
      ids, top: Math.min(...boxes.map((r) => r.top)), bottom: Math.max(...boxes.map((r) => r.bottom))
    };
  }).filter((line) => Number.isFinite(line.top));
}

/** The column the dragged thing's left edge is over: where it was picked up is kept under the pointer. */
function columnAt(x: number, f: Frame): number {
  const span = clampSpan(viewEditor.ui.dragSpan);
  const width = (span * f.pitch) - props.gap;
  const grab = viewEditor.ui.dragGrab === null ? width / 2 : Math.min(viewEditor.ui.dragGrab, width);

  return Math.max(0, Math.min(GRID_COLUMNS - span, Math.round((x - grab - f.left) / f.pitch)));
}

// The first widget from line `from` on that is not the one being moved - what a new line is opened above.
function anchorFrom(lines: LineBox[], from: number): string | null {
  for (let i = from; i < lines.length; i++) {
    const id = lines[i].ids.find((x) => x !== viewEditor.ui.dragId);

    if (id) {
      return id;
    }
  }

  return null;
}

/**
 * Where a drop at the pointer lands: its column, and either a line to join or a new line - near a
 * line's top or bottom edge, or on the line the moved widget has to itself.
 */
function targetAt(ev: DragEvent, f: Frame, lines: LineBox[]): DropTarget {
  const col = columnAt(ev.clientX, f);
  const y = ev.clientY;

  for (let i = 0; i < lines.length; i++) {
    if (y < lines[i].top + NEW_LINE_ZONE) {
      return { col, before: anchorFrom(lines, i) };
    }
    if (y < lines[i].bottom - NEW_LINE_ZONE) {
      const mate = lines[i].ids.find((x) => x !== viewEditor.ui.dragId);

      return mate ? { col, join: mate } : { col, before: anchorFrom(lines, i + 1) };
    }
  }

  return { col, before: null };
}

/**
 * Work the drop out as it would be done, and draw it: the ghost where the dragged thing lands, and
 * a mark on every widget that would move over to make room.
 */
function preview(t: DropTarget, f: Frame, lines: LineBox[]): void {
  const span = clampSpan(viewEditor.ui.dragSpan);
  const base = viewEditor.ui.dragId ? liftFrom(shown.value, viewEditor.ui.dragId) : shown.value;
  const result = dropInto(base, newWidgetNode('links', { id: GHOST_ID, colSpan: span }), t);
  const was = gridCells(base);
  const now = gridCells(result);
  const moved = new Set<string>();
  const outlines: Ghost[] = [];

  // Making room only ever moves a widget along its own line, so it is outlined on the line it is on.
  now.forEach((cell, id) => {
    const before = was.get(id);
    const el = before && before.col !== cell.col ? tile(id) : null;

    if (el) {
      const r = el.getBoundingClientRect();

      moved.add(id);
      outlines.push({
        left: cell.col * f.pitch, top: r.top - f.top, width: (cell.span * f.pitch) - props.gap, height: r.height, bar: false
      });
    }
  });
  shifting.value = moved;
  shadows.value = outlines;

  const me = now.get(GHOST_ID);

  if (!me) {
    ghost.value = null;

    return;
  }

  const resultLines = gridLines(result);
  const lineOf = (id: string | undefined) => (id ? lines.find((line) => line.ids.includes(id)) : undefined);
  const mate = lineOf(resultLines[me.line].find((id) => id !== GHOST_ID));
  const box = { left: me.col * f.pitch, width: (span * f.pitch) - props.gap };

  if (mate) {
    ghost.value = {
      ...box, top: mate.top - f.top, height: mate.bottom - mate.top, bar: false
    };

    return;
  }

  // A line of its own: a bar in the gap it opens, above the line after it or below the last.
  const next = lineOf(resultLines[me.line + 1]?.[0]);
  const last = lines[lines.length - 1];
  const edge = next ? next.top - (props.gap / 2) : (last ? last.bottom + (props.gap / 2) : f.top);

  ghost.value = {
    ...box, top: edge - f.top - 3, height: 6, bar: true
  };
}

function tile(id: string): HTMLElement | null {
  return Array.from(body.value?.children || []).find((el) => (el as HTMLElement).dataset?.nodeId === id) as HTMLElement || null;
}

// ---- the gap, lit as it changes ----
// Only where it really separates two widgets: between neighbours that touch on a line, and between
// lines where a widget sits over another. Empty columns, the end of a line and the room under a
// short widget are not the gap, so they stay dark. Measured from the grid's own tracks, so a
// widget's margin - which sits inside its cells - never moves a strip.

const gapStrips = ref<CSSProperties[]>([]);

/** Merge overlapping [from, to) column runs. */
function mergeRuns(runs: [number, number][]): [number, number][] {
  const out: [number, number][] = [];

  for (const [from, to] of [...runs].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];

    if (last && from <= last[1]) {
      last[1] = Math.max(last[1], to);
    } else {
      out.push([from, to]);
    }
  }

  return out;
}

function measureGaps(): void {
  const el = body.value;

  if (!el || !props.flashGap || !props.gap) {
    gapStrips.value = [];

    return;
  }

  const gap = props.gap;
  const pitch = (el.clientWidth + gap) / GRID_COLUMNS;
  // The used height of every row, implicit ones included
  const rows = getComputedStyle(el).gridTemplateRows.split(' ').map((v) => parseFloat(v) || 0);
  const tops = rows.reduce<number[]>((acc, h, i) => [...acc, i ? acc[i - 1] + rows[i - 1] + gap : 0], []);
  const lines = gridLines(shown.value).map((ids) => ids.map((id) => cells.value.get(id)).filter((c): c is NonNullable<typeof c> => !!c));
  const strips: CSSProperties[] = [];
  const px = (v: number) => `${ v }px`;

  lines.forEach((line, i) => {
    // Across a line: between two widgets with no empty column between them
    line.forEach((a, k) => {
      const b = line[k + 1];

      if (b && b.col === a.col + a.span && rows[i] !== undefined) {
        strips.push({
          left: px((b.col * pitch) - gap), top: px(tops[i]), width: px(gap), height: px(rows[i])
        });
      }
    });

    // Down to the next line: over the columns a widget above and a widget below share
    const next = lines[i + 1];

    if (next && rows[i] !== undefined) {
      const shared = line.flatMap((a) => next
        .map((c): [number, number] => [Math.max(a.col, c.col), Math.min(a.col + a.span, c.col + c.span)])
        .filter(([from, to]) => to > from));

      mergeRuns(shared).forEach(([from, to]) => strips.push({
        left: px(from * pitch), top: px(tops[i] + rows[i]), width: px(((to - from) * pitch) - gap), height: px(gap)
      }));
    }
  });

  gapStrips.value = strips;
}

// Laid out first: the strips are read off the tracks the new gap gives.
watch(() => [props.flashGap, props.gap], () => nextTick(measureGaps));

function clearPreview(): void {
  target.value = null;
  ghost.value = null;
  shadows.value = [];
  if (shifting.value.size) {
    shifting.value = new Set();
  }
}

// ---- edge scrolling while dragging ----

// The scroller the page actually uses — Rancher scrolls a main element, not the window. Found once.
let scrollEl: HTMLElement | null | undefined;

function scroller(): HTMLElement | null {
  if (scrollEl !== undefined) {
    return scrollEl;
  }

  let el = root.value?.parentElement || null;

  while (el && el !== document.body) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) {
      scrollEl = el;

      return el;
    }
    el = el.parentElement;
  }

  scrollEl = null;

  return null;
}

// How fast to scroll for a pointer at `y`: 0 outside the edge zones, ramping to MAX_SPEED at the
// very edge, negative for up.
function edgeSpeed(y: number): number {
  const el = scroller();
  const top = el ? el.getBoundingClientRect().top : 0;
  const bottom = el ? el.getBoundingClientRect().bottom : window.innerHeight;

  if (y < top + EDGE) {
    return -Math.ceil(((top + EDGE - y) / EDGE) * MAX_SPEED);
  }
  if (y > bottom - EDGE) {
    return Math.ceil(((y - (bottom - EDGE)) / EDGE) * MAX_SPEED);
  }

  return 0;
}

function stopScrolling(): void {
  if (scrollTimer) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
}

function autoScroll(y: number): void {
  const speed = edgeSpeed(y);

  stopScrolling();

  if (!speed) {
    return;
  }

  const el = scroller();

  scrollTimer = setInterval(() => {
    if (el) {
      el.scrollTop += speed;
    } else {
      window.scrollBy(0, speed);
    }
  }, 16);
}

// ---- drag & drop ----

function onDragOver(ev: DragEvent): void {
  if (!accepts.value) {
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();
  viewEditor.ui.dropPlace = key.value;
  if (ev.dataTransfer) {
    ev.dataTransfer.dropEffect = viewEditor.ui.dragEntry ? 'copy' : 'move';
  }

  const f = frame();

  if (f) {
    const lines = measureLines();

    target.value = targetAt(ev, f, lines);
    preview(target.value, f, lines);
  }
  autoScroll(ev.clientY);
}

function onDragLeave(ev: DragEvent): void {
  // Ignore bubbling leaves from children still inside the grid.
  if (root.value?.contains(ev.relatedTarget as Node | null)) {
    return;
  }
  clearPreview();
  stopScrolling();
}

function onDrop(ev: DragEvent): void {
  if (!accepts.value) {
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();

  const f = frame();
  const t = target.value || (f ? targetAt(ev, f, measureLines()) : { col: 0, before: null });

  clearPreview();
  stopScrolling();
  viewEditor.dropAt(t, props.place);
}

function onEndOver(ev: DragEvent): void {
  if (!accepts.value) {
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();
  viewEditor.ui.dropPlace = key.value;

  // The box lights up for itself: a new line at the end, on the column the pointer is over.
  const f = frame();

  clearPreview();
  target.value = { col: f ? columnAt(ev.clientX, f) : 0, before: null };
}

function onDropAtEnd(ev: DragEvent): void {
  if (!accepts.value) {
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();

  const t = target.value || { col: 0, before: null };

  clearPreview();
  stopScrolling();
  viewEditor.dropAt(t, props.place);
}

// A drag that ends anywhere — including outside the grid, or cancelled with Escape — must stop the
// page scrolling and put the preview away. dragend fires on the source, so it is listened for globally.
function onDragFinished(): void {
  stopScrolling();
  clearPreview();
}

onMounted(() => {
  document.addEventListener('dragend', onDragFinished);
  document.addEventListener('drop', onDragFinished);
});

onBeforeUnmount(() => {
  stopScrolling();
  document.removeEventListener('dragend', onDragFinished);
  document.removeEventListener('drop', onDragFinished);
});
</script>

<template>
  <div
    ref="root"
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
      <template v-if="flashGap">
        <div
          v-for="(strip, i) in gapStrips"
          :key="`gap-${ i }`"
          class="wgrid__gap"
          data-testid="configurable-views-gap-strip"
          :style="strip"
        />
      </template>
      <div
        v-if="showGuides"
        class="wgrid__guides"
        :class="{ 'wgrid__guides--active': accepts }"
        :style="tracks"
        aria-hidden="true"
      >
        <span
          v-for="c in columns"
          :key="c"
        />
      </div>

      <WidgetNode
        v-for="widget in shown"
        :key="widget.id"
        :node="widget"
        :cell="cells.get(widget.id)"
        :editing="editing"
        :selected="widget.id === selectedId"
        :shifting="over && shifting.has(widget.id)"
        :gap="gap"
      />

      <!-- Where the widgets it pushes aside end up -->
      <template v-if="over">
        <div
          v-for="(shadow, i) in shadows"
          :key="i"
          class="wgrid__ghost wgrid__ghost--shifted"
          data-testid="configurable-views-drop-shifted"
          :style="{ left: `${ shadow.left }px`, top: `${ shadow.top }px`, width: `${ shadow.width }px`, height: `${ shadow.height }px` }"
        />
      </template>

      <!-- Where the drop lands: the cells it takes, or a bar for the new line it opens -->
      <div
        v-if="over && ghost"
        class="wgrid__ghost"
        :class="{ 'wgrid__ghost--bar': ghost.bar }"
        data-testid="configurable-views-drop-ghost"
        :style="{ left: `${ ghost.left }px`, top: `${ ghost.top }px`, width: `${ ghost.width }px`, height: `${ ghost.height }px` }"
      />
    </div>

    <!-- The end of the grid is always a place to drop into. It is a target, not a widget: nothing
       is stored for it, and it disappears the moment you stop editing. -->
    <div
      v-if="editing"
      class="wgrid__end"
      :class="{ 'wgrid__end--active': accepts, 'wgrid__end--nested': !!place }"
      :style="{ marginTop: `${ gap }px` }"
      @dragover="onEndOver"
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
    position:  relative; // anchors the column guides and the gap strips to the grid's content box
  }

  // One stretch of the gap, lit as the gap changes
  &__gap {
    background:     color-mix(in srgb, var(--primary) 35%, transparent);
    pointer-events: none;
    position:       absolute;
    z-index:        1;
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

  // Where the drop lands: the cells it will take, over whatever is drawn there now.
  &__ghost {
    background:     color-mix(in srgb, var(--primary) 18%, transparent);
    border:         2px dashed var(--primary);
    border-radius:  4px;
    box-sizing:     border-box;
    pointer-events: none;
    position:       absolute;
    transition:     left 0.08s ease-out, top 0.08s ease-out, width 0.08s ease-out, height 0.08s ease-out;
    z-index:        7;

    // A new line between two: a solid bar in the gap it opens
    &--bar {
      background: var(--primary);
      border:     0;
    }

    // Where a pushed widget goes: outlined only, so the drop's own ghost reads first
    &--shifted {
      background: transparent;
      border:     2px dotted var(--primary);
    }
  }

  // The tinted, dashed box at the end of the grid.
  &__end {
    align-items:     center;
    background:      color-mix(in srgb, var(--primary) 12%, transparent);
    border:          2px dashed var(--primary);
    border-radius:   4px;
    box-sizing:      border-box;
    color:           var(--primary);
    display:         flex;
    font-size:       14px;
    justify-content: center;
    min-height:      78px;
    text-align:      center;

    &--nested {
      min-height: 56px;
    }
  }
}
</style>
