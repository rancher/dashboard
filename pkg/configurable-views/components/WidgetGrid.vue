<script setup lang="ts">
import {
  computed, onBeforeUnmount, onMounted, ref, type CSSProperties
} from 'vue';
import WidgetNode from './WidgetNode.vue';
import { GRID_COLUMNS, DEFAULT_GAP, canPlace } from '../templating/view-model';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useViewEditor, placeKey } from '../composables/viewEditor';
import type { WidgetNode as WidgetNodeSpec, WidgetPlace } from '../templating/types';

// The grid: a view's widgets, in order, wrapping onto lines.
//
// It is ONE flex container, not a tree. A widget takes its span's share of a 12-column line and
// wraps when there is no room left, which is what makes rows an emergent property of the widths
// rather than objects anyone has to manage. There is exactly one drop target — the list — and a
// drop resolves to an INDEX in it.
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
}>(), {
  widgets:    () => [],
  editing:    false,
  selectedId: '',
  gap:        DEFAULT_GAP,
  place:      null,
});

const viewEditor = useViewEditor();
const store = useStore();
const { t } = useI18n(store);

const root = ref<HTMLElement | null>(null);
const body = ref<HTMLElement | null>(null);
const dropIndex = ref(-1);
let scrollTimer: ReturnType<typeof setInterval> | null = null;

const columns = GRID_COLUMNS;

// Something is on its way onto the grid: a widget already on it being moved, or a catalog entry
// being dragged in from the drawer. Both light up the drop targets.
const dragActive = computed(() => props.editing && !!(viewEditor.ui.dragId || viewEditor.ui.dragEntry));

// Whether what is being dragged may land here at all.
const accepts = computed(() => dragActive.value && canPlace(viewEditor.ui.dragKind, props.place));

const key = computed(() => placeKey(props.place));

// The insertion marker belongs to the one grid the pointer is over — never to a grid it has left for
// a tab inside it, or for the grid around it.
const markerAt = computed(() => (accepts.value && viewEditor.ui.dropPlace === key.value ? dropIndex.value : -1));

const style = computed<CSSProperties>(() => ({
  alignContent: 'flex-start',
  alignItems:   'flex-start',
  display:      'flex',
  flexWrap:     'wrap',
  gap:          `${ props.gap }px`,
}));

// The guide overlay is its own 12-track grid, so the lines always mark exact twelfths.
const guideStyle = computed<CSSProperties>(() => ({
  display:             'grid',
  gap:                 `${ props.gap }px`,
  gridTemplateColumns: `repeat(${ GRID_COLUMNS }, minmax(0, 1fr))`,
}));

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

/**
 * Where a drop would land: compare the pointer with each widget's box. Widgets wrap, so a widget
 * counts as "before the pointer" when it is on an earlier line, or on the same line and left of the
 * pointer — reading order, exactly as the list is ordered.
 */
function computeDropIndex(ev: DragEvent): number {
  const tiles = Array.from(body.value?.children || []).filter((el): el is HTMLElement => !!(el as HTMLElement).dataset?.nodeId);

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
  dropIndex.value = computeDropIndex(ev);
  autoScroll(ev.clientY);
}

function onDragLeave(ev: DragEvent): void {
  // Ignore bubbling leaves from children still inside the grid.
  if (root.value?.contains(ev.relatedTarget as Node | null)) {
    return;
  }
  dropIndex.value = -1;
  stopScrolling();
}

function onDrop(ev: DragEvent): void {
  if (!accepts.value) {
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();

  const index = markerAt.value >= 0 ? markerAt.value : computeDropIndex(ev);

  dropIndex.value = -1;
  stopScrolling();
  viewEditor.dropAt(index, props.place);
}

function onEndOver(ev: DragEvent): void {
  if (!accepts.value) {
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();
  viewEditor.ui.dropPlace = key.value;
  dropIndex.value = -1;
}

function onDropAtEnd(ev: DragEvent): void {
  if (!accepts.value) {
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();
  dropIndex.value = -1;
  stopScrolling();
  viewEditor.dropAt(props.widgets.length, props.place);
}

// A drag that ends anywhere — including outside the grid, or cancelled with Escape — must stop the
// page scrolling. dragend fires on the source, so it is listened for globally.
onMounted(() => {
  document.addEventListener('dragend', stopScrolling);
  document.addEventListener('drop', stopScrolling);
});

onBeforeUnmount(() => {
  stopScrolling();
  document.removeEventListener('dragend', stopScrolling);
  document.removeEventListener('drop', stopScrolling);
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
      <div
        v-if="showGuides"
        class="wgrid__guides"
        :class="{ 'wgrid__guides--active': accepts }"
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
          v-if="markerAt === i"
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
        v-if="markerAt >= widgets.length"
        class="wgrid__drop"
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

  // The tinted, dashed box at the end of the grid.
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

    &--nested {
      min-height: 56px;
    }
  }
}
</style>
