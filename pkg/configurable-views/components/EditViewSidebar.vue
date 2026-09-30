<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import CatalogTile from './CatalogTile.vue';
import {
  BUILDING_BLOCKS, READY_MADE, searchCatalog, blockLabelKey, type CatalogEntry
} from '../templating/widget-catalog';
import {
  WIDTH_PRESETS, HEIGHT_PRESETS, SPACING_PRESETS, COLUMN_SPANS,
  DEFAULT_GAP, DEFAULT_PAGE_PADDING, widthPresetOf, heightPresetOf, spacingPresetOf
} from '../templating/view-model';
import type { View, Sides, WidgetNode } from '../templating/types';

// The "Edit view" drawer. Three tabs, and the split between them is the point:
//
//   ADD     what goes on the grid — building blocks (a shape, you say what it shows) and
//           ready-made widgets (the same shapes with their data already chosen).
//   LAYOUT  how the SELECTED widget sits — width, height, spacing, and exact pixels under Advanced.
//   VIEW   what is true of the WHOLE view — its name, its gap, whether it is your default.
//
// Everything is emitted; the drawer holds only its own tab, search box and Advanced toggle.

/** A view a new one can start as a copy of. */
export interface StartingPoint {
  id: string;
  label: string;
}

type SidebarEmits = {
  close: [];
  add: [entry: CatalogEntry];
  'drag-start': [entry: CatalogEntry, event: DragEvent];
  'drag-end': [];
  'set-width': [span: number];
  'set-height': [preset: string];
  'set-spacing': [preset: string];
  'set-box': [box: 'margin' | 'padding', side: keyof Sides, value: string];
  'set-col-span': [span: number];
  'set-gap': [value: string];
  'set-page-padding': [value: string];
  'set-name': [name: string];
  'set-default': [];
  publish: [];
  delete: [];
  /** '' starts from nothing. */
  'start-from': [viewId: string];
};

const props = withDefaults(defineProps<{
  /** The view being edited. */
  view?: View | null;
  /** The widget the Layout tab acts on (null when nothing is selected). */
  selected?: WidgetNode | null;
  isDefault?: boolean;
  /**
   * A view that has never been saved shows its starting points instead of jumping straight to the
   * catalog — the first decision is what it should be ABOUT.
   */
  isNew?: boolean;
  startedFrom?: string;
  startingPoints?: StartingPoint[];
  /**
   * The page's own stock content, kept as a view. There is no grid behind it, so there is nothing to add to it
   * and nothing to lay out.
   */
  isStock?: boolean;
}>(), {
  view:           null,
  selected:       null,
  isDefault:      false,
  isNew:          false,
  startedFrom:    '',
  startingPoints: () => [],
  isStock:        false,
});

defineEmits<SidebarEmits>();

const store = useStore();
const { t } = useI18n(store);

const TABS = [
  { id: 'add', labelKey: 'configurableViews.sidebar.tabs.add' },
  { id: 'layout', labelKey: 'configurableViews.sidebar.tabs.layout' },
  { id: 'view', labelKey: 'configurableViews.sidebar.tabs.view' },
];

// ---- the drawer's width, dragged from its left edge ----

const DRAWER_WIDTH_KEY = 'configurable-views-drawer-width';
const DRAWER_MIN = 320;
const DRAWER_DEFAULT = 380;
const DRAWER_STEP = 20;

/** Up to 60% of the window, so the grid beside it always keeps some room. */
const drawerMax = () => Math.max(DRAWER_MIN, Math.round(window.innerWidth * 0.6));

const clampWidth = (px: number) => Math.min(Math.max(Math.round(px), DRAWER_MIN), drawerMax());

function readWidth(): number {
  try {
    const stored = Number(window.localStorage.getItem(DRAWER_WIDTH_KEY));

    return stored ? clampWidth(stored) : DRAWER_DEFAULT;
  } catch {
    return DRAWER_DEFAULT;
  }
}

/** Per browser, like the bar's own visibility. */
const drawerWidth = ref(readWidth());

function keepWidth(): void {
  try {
    window.localStorage.setItem(DRAWER_WIDTH_KEY, String(drawerWidth.value));
  } catch {
    // Kept for this page load only
  }
}

let resizeFrom: { x: number, width: number } | null = null;

function onResizeMove(ev: MouseEvent): void {
  if (resizeFrom) {
    // The drawer is on the right, so dragging left widens it
    drawerWidth.value = clampWidth(resizeFrom.width + resizeFrom.x - ev.clientX);
  }
}

function stopResize(): void {
  resizeFrom = null;
  document.body.style.cursor = '';
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', stopResize);
  keepWidth();
}

function startResize(ev: MouseEvent): void {
  if (ev.button !== 0) {
    return;
  }

  ev.preventDefault();
  resizeFrom = { x: ev.clientX, width: drawerWidth.value };
  document.body.style.cursor = 'col-resize';
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', stopResize);
}

function stepWidth(delta: number): void {
  drawerWidth.value = clampWidth(drawerWidth.value + delta);
  keepWidth();
}

onBeforeUnmount(() => {
  if (resizeFrom) {
    stopResize();
  }
});

/** The body the tabs switch, for their aria-controls. */
const PANEL_ID = 'configurable-views-editor-panel';

const tab = ref('add');
const search = ref('');
const advancedOpen = ref(false);

const widths = WIDTH_PRESETS;
const heights = HEIGHT_PRESETS;
const spacings = SPACING_PRESETS;
const columnSpans = COLUMN_SPANS;
const sides: (keyof Sides)[] = ['top', 'right', 'bottom', 'left'];

// Searched as it reads: the translated name and description.
const tileText = (entry: CatalogEntry) => `${ t(entry.labelKey) } ${ t(entry.descKey) }`;
const blocks = computed(() => searchCatalog(BUILDING_BLOCKS, search.value, tileText));
const readyMade = computed(() => searchCatalog(READY_MADE, search.value, tileText));

const gap = computed(() => (props.view && 'gap' in props.view ? props.view.gap : DEFAULT_GAP));
const pagePadding = computed(() => (props.view && 'pad' in props.view ? props.view.pad : DEFAULT_PAGE_PADDING));

// "Selected: Clusters (Table)" — the widget's own title, then which building block it is.
const selectedLabel = computed(() => {
  const widget = props.selected?.widget;

  if (!widget) {
    return '';
  }

  const key = blockLabelKey(widget.kind);
  const block = key ? t(key) : widget.kind;

  return t('configurableViews.sidebar.selected', { title: widget.title || block, block });
});

const widthPreset = computed(() => (props.selected ? widthPresetOf(props.selected.colSpan) : null));
const heightPreset = computed(() => (props.selected ? heightPresetOf(props.selected.height, gap.value) : null));
const spacingPreset = computed(() => (props.selected ? spacingPresetOf(props.selected.padding) : null));

function toggleAdvanced(): void {
  advancedOpen.value = !advancedOpen.value;
}

function sideLabel(side: keyof Sides): string {
  return t(`configurableViews.sidebar.sides.${ side }`);
}

/** What an input or select holds, from its event. */
function valueOf(ev: Event): string {
  return (ev.target as HTMLInputElement).value;
}
</script>

<template>
  <aside
    class="evs"
    :style="{ width: `${ drawerWidth }px`, flexBasis: `${ drawerWidth }px` }"
  >
    <!-- Drag to widen or narrow the drawer; the arrow keys do the same once it has focus -->
    <div
      class="evs__resize"
      role="separator"
      aria-orientation="vertical"
      tabindex="0"
      :aria-label="t('configurableViews.sidebar.resize')"
      :aria-valuenow="drawerWidth"
      :aria-valuemin="DRAWER_MIN"
      data-testid="configurable-views-drawer-resize"
      @mousedown="startResize"
      @dblclick="stepWidth(DRAWER_DEFAULT - drawerWidth)"
      @keydown.left.prevent="stepWidth(DRAWER_STEP)"
      @keydown.right.prevent="stepWidth(-DRAWER_STEP)"
    />
    <header class="evs__head">
      <h3 class="evs__title">
        {{ t('configurableViews.sidebar.title') }}<template v-if="view">
          &nbsp;-&nbsp; {{ view.name }}
        </template>
      </h3>
      <button
        class="evs__close"
        :title="t('generic.close')"
        :aria-label="t('configurableViews.sidebar.closeEditor')"
        @click="$emit('close')"
      >
        <i class="icon icon-close" />
      </button>
    </header>

    <!-- The product's own tabs, as the Extensions page uses them: the row only, with the body below
       as their panel so it scrolls under a row that stays put -->
    <Tabbed
      class="evs__tabs"
      :tabs-only="true"
      :use-hash="false"
      default-tab="add"
      :external-panel-id="PANEL_ID"
      data-testid="configurable-views-editor-tabs"
      @changed="tab = $event.selectedName"
    >
      <Tab
        v-for="(item, i) in TABS"
        :key="item.id"
        :name="item.id"
        :label-key="item.labelKey"
        :weight="TABS.length - i"
      />
    </Tabbed>

    <div
      :id="PANEL_ID"
      role="tabpanel"
      class="evs__body"
      :class="{ 'evs__body--layout': tab === 'layout' }"
    >
      <!-- A stock view is Rancher's own page with no grid behind it: nothing to add, nothing to
         lay out. Its tab still works — it can be made the default like any other. -->
      <p
        v-if="isStock && tab !== 'view'"
        class="evs__hint"
      >
        {{ t('configurableViews.sidebar.stockHint') }}
      </p>

      <!-- ---- ADD ---- -->
      <template v-else-if="tab === 'add'">
        <!-- A brand-new view: name it, drag things in, or start it from something that exists. -->
        <section
          v-if="isNew"
          class="evs__new"
        >
          <h4 class="evs__new-title">
            {{ startedFrom ? t('configurableViews.sidebar.newViewFrom', { source: startedFrom }) : t('configurableViews.sidebar.newView') }}
          </h4>
          <p class="evs__hint">
            {{ t('configurableViews.sidebar.newHint') }}
          </p>
          <div class="evs__chips">
            <button
              class="evs__chip"
              @click="$emit('start-from', '')"
            >
              {{ t('configurableViews.sidebar.startEmpty') }}
            </button>
            <button
              v-for="point in startingPoints"
              :key="point.id"
              v-clean-tooltip="point.label"
              class="evs__chip"
              @click="$emit('start-from', point.id)"
            >
              {{ point.label }}
            </button>
          </div>
          <p class="evs__hint">
            {{ t('configurableViews.sidebar.newFootnote') }}
          </p>
        </section>

        <input
          v-model="search"
          class="evs__field"
          :placeholder="t('configurableViews.sidebar.search')"
          :aria-label="t('configurableViews.sidebar.search')"
        >

        <p class="evs__hint">
          {{ t('configurableViews.sidebar.dragHint') }}
        </p>

        <h4 class="evs__group">
          {{ t('configurableViews.sidebar.blocks') }}
        </h4>
        <p class="evs__hint">
          {{ t('configurableViews.sidebar.blocksHint') }}
        </p>
        <div class="evs__tiles">
          <CatalogTile
            v-for="entry in blocks"
            :key="entry.id"
            :entry="entry"
            @dragstart="(e, ev) => $emit('drag-start', e, ev)"
            @dragend="$emit('drag-end')"
            @add="$emit('add', $event)"
          />
          <p
            v-if="!blocks.length"
            class="evs__hint"
          >
            {{ t('configurableViews.sidebar.noBlocks', { query: search }) }}
          </p>
        </div>

        <h4 class="evs__group">
          {{ t('configurableViews.sidebar.readyMade') }}
        </h4>
        <p class="evs__hint">
          {{ t('configurableViews.sidebar.readyMadeHint') }}
        </p>
        <div class="evs__tiles">
          <CatalogTile
            v-for="entry in readyMade"
            :key="entry.id"
            :entry="entry"
            @dragstart="(e, ev) => $emit('drag-start', e, ev)"
            @dragend="$emit('drag-end')"
            @add="$emit('add', $event)"
          />
          <p
            v-if="!readyMade.length"
            class="evs__hint"
          >
            {{ t('configurableViews.sidebar.noReadyMade', { query: search }) }}
          </p>
        </div>
      </template>

      <!-- ---- LAYOUT ---- -->
      <template v-else-if="tab === 'layout'">
        <p
          v-if="selected"
          class="evs__selected"
        >
          {{ selectedLabel }}
        </p>
        <p class="evs__hint">
          {{ t('configurableViews.sidebar.layoutHint') }}
        </p>

        <template v-if="selected">
          <div class="evs__control">
            <h4 class="evs__label">
              {{ t('configurableViews.sidebar.width') }}
            </h4>
            <div class="evs__seg">
              <button
                v-for="w in widths"
                :key="w.id"
                class="evs__pill"
                :class="{ 'evs__pill--on': widthPreset === w.id }"
                @click="$emit('set-width', w.span)"
              >
                {{ t(w.labelKey) }}
              </button>
            </div>
          </div>

          <div class="evs__control">
            <h4 class="evs__label">
              {{ t('configurableViews.sidebar.height') }}
            </h4>
            <div class="evs__seg">
              <button
                v-for="h in heights"
                :key="h.id"
                class="evs__pill"
                :class="{ 'evs__pill--on': heightPreset === h.id }"
                @click="$emit('set-height', h.id)"
              >
                {{ t(h.labelKey) }}
              </button>
            </div>
          </div>

          <div class="evs__control">
            <h4 class="evs__label">
              {{ t('configurableViews.sidebar.spacing') }}
            </h4>
            <div class="evs__seg">
              <button
                v-for="s in spacings"
                :key="s.id"
                class="evs__pill"
                :class="{ 'evs__pill--on': spacingPreset === s.id }"
                @click="$emit('set-spacing', s.id)"
              >
                {{ t(s.labelKey) }}
              </button>
            </div>
          </div>

          <button
            class="evs__advanced"
            :aria-expanded="advancedOpen ? 'true' : 'false'"
            @click="toggleAdvanced"
          >
            <i
              class="icon"
              :class="advancedOpen ? 'icon-chevron-down' : 'icon-chevron-right'"
            />
            {{ t('configurableViews.sidebar.advanced') }}
          </button>

          <template v-if="advancedOpen">
            <p class="evs__hint">
              {{ t('configurableViews.sidebar.advancedHint') }}
            </p>

            <div class="evs__control">
              <h4 class="evs__label evs__label--margin">
                {{ t('configurableViews.sidebar.margin') }}
              </h4>
              <div class="evs__sides">
                <label
                  v-for="side in sides"
                  :key="`m-${ side }`"
                >
                  <input
                    class="evs__field evs__field--num"
                    type="number"
                    :value="selected.margin[side]"
                    @change="$emit('set-box', 'margin', side, valueOf($event))"
                  >
                  <span>{{ sideLabel(side) }}</span>
                </label>
              </div>
            </div>

            <div class="evs__control">
              <h4 class="evs__label evs__label--padding">
                {{ t('configurableViews.sidebar.padding') }}
              </h4>
              <div class="evs__sides">
                <label
                  v-for="side in sides"
                  :key="`p-${ side }`"
                >
                  <input
                    class="evs__field evs__field--num"
                    type="number"
                    :value="selected.padding[side]"
                    @change="$emit('set-box', 'padding', side, valueOf($event))"
                  >
                  <span>{{ sideLabel(side) }}</span>
                </label>
              </div>
            </div>

            <div class="evs__control">
              <h4 class="evs__label">
                {{ t('configurableViews.sidebar.columnSpan') }}
              </h4>
              <div class="evs__seg">
                <button
                  v-for="span in columnSpans"
                  :key="span"
                  class="evs__pill evs__pill--narrow"
                  :class="{ 'evs__pill--on': selected.colSpan === span }"
                  @click="$emit('set-col-span', span)"
                >
                  {{ span }}
                </button>
              </div>
            </div>
          </template>
        </template>
      </template>

      <!-- ---- VIEW ---- -->
      <template v-else>
        <p class="evs__hint">
          {{ t('configurableViews.sidebar.viewHint') }}
        </p>

        <h4 class="evs__group">
          {{ t('configurableViews.sidebar.name') }}
        </h4>
        <input
          class="evs__field"
          :value="view ? view.name : ''"
          :aria-label="t('configurableViews.bar.viewName')"
          @input="$emit('set-name', valueOf($event))"
        >

        <h4
          v-if="!isStock"
          class="evs__group"
        >
          {{ t('configurableViews.sidebar.gap') }}
        </h4>
        <div
          v-if="!isStock"
          class="evs__row"
        >
          <input
            class="evs__field evs__field--num"
            type="number"
            min="0"
            max="64"
            :value="gap"
            :aria-label="t('configurableViews.sidebar.gapLabel')"
            @change="$emit('set-gap', valueOf($event))"
          >
          <span class="evs__hint">{{ t('configurableViews.sidebar.gapHint') }}</span>
        </div>

        <h4
          v-if="!isStock"
          class="evs__group"
        >
          {{ t('configurableViews.sidebar.pagePadding') }}
        </h4>
        <div
          v-if="!isStock"
          class="evs__row"
        >
          <input
            class="evs__field evs__field--num"
            type="number"
            min="0"
            max="96"
            :value="pagePadding"
            :aria-label="t('configurableViews.sidebar.pagePaddingLabel')"
            @change="$emit('set-page-padding', valueOf($event))"
          >
          <span class="evs__hint">{{ t('configurableViews.sidebar.pagePaddingHint') }}</span>
        </div>

        <h4 class="evs__group">
          {{ t('configurableViews.sidebar.thisView') }}
        </h4>
        <button
          class="btn btn-sm role-secondary evs__wide"
          :disabled="isDefault"
          @click="$emit('set-default')"
        >
          {{ isDefault ? t('configurableViews.sidebar.isDefault') : t('configurableViews.sidebar.setDefault') }}
        </button>
        <button
          class="btn btn-sm role-secondary evs__wide"
          @click="$emit('publish')"
        >
          {{ t('configurableViews.sidebar.publish') }}
        </button>
        <button
          class="btn btn-sm role-link evs__wide evs__danger"
          @click="$emit('delete')"
        >
          {{ t('configurableViews.sidebar.delete') }}
        </button>
      </template>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
// 380px wide until dragged wider, its own scroll — the grid beside it keeps the width it will really
// have. It starts below the view bar, which spans the whole page above both of them.
.evs {
  background:     var(--body-bg);
  border-left:    1px solid var(--border);
  box-sizing:     border-box;
  display:        flex;
  flex:           0 0 auto;
  flex-direction: column;
  // Below the view bar, which is sticky at 0 and spans the page above both of us. At top:0 this
  // rode up over the bar the moment the page scrolled.
  height:         calc(100vh - var(--header-height, 54px) - 57px);
  position:       sticky;
  top:            57px;
  // Above the view bar, below the app header's stacking context (see the note at the foot of this
  // file) — the drawer is page chrome and must never cover the header's menus.
  z-index:        9;

  // The drag handle along the left edge: a few pixels either side of the hairline, lit on hover
  &__resize {
    bottom:   0;
    cursor:   col-resize;
    left:     -4px;
    position: absolute;
    top:      0;
    width:    8px;
    z-index:  1;

    &:hover,
    &:focus-visible {
      background: linear-gradient(90deg, transparent 3px, var(--primary) 3px, var(--primary) 5px, transparent 5px);
      outline:    none;
    }
  }

  &__head {
    align-items:     center;
    box-sizing:      border-box;
    display:         flex;
    flex:            0 0 auto;
    height:          56px;
    justify-content: space-between;
    padding:         0 16px;
  }

  &__title {
    font-size:     16px;
    font-weight:   600;
    margin:        0;
    overflow:      hidden;
    text-overflow: ellipsis;
    white-space:   nowrap;
  }

  &__close {
    background:  transparent;
    border:      none;
    color:       var(--muted);
    cursor:      pointer;
    font-size:   16px;
    line-height: 1;
    min-height:  0;
    padding:     4px;

    &:hover {
      color: var(--link);
    }
  }

  // A 25px strip: 12px labels, 16px apart, the active one underlined ON the strip's own hairline.
  // The shell's Tabbed, in its tabs-only form. Its bottom margin is for a page; here the body
  // follows straight on.
  &__tabs {
    flex:          0 0 auto;
    margin-bottom: 0;
  }

  &__body {
    display:        flex;
    flex:           1 1 auto;
    flex-direction: column;
    gap:            10px;
    overflow-y:     auto;
    padding:        16px;

    // The Layout tab is a list of controls rather than prose, and the design gives it more air.
    &--layout {
      gap: 14px;
    }

    // A column flex container shrinks its items before it overflows, which silently squashed every
    // fixed-height control in here (a 32px input rendered at 19px). Nothing in this list shrinks.
    > * {
      flex: 0 0 auto;
    }
  }

  &__hint {
    color:       var(--muted);
    font-size:   12px;
    line-height: 1.35;
    margin:      0;
  }

  // A SECTION heading in the Add tab ("Building blocks", "Ready-made", "Advanced").
  &__group {
    font-size:   13px;
    font-weight: 700;
    margin:      0;
  }

  // The label above one control in the Layout tab. Quieter than a section heading — it names a
  // setting, it does not open a part of the drawer.
  &__label {
    color:         var(--muted);
    font-size:     12px;
    font-weight:   700;
    line-height:   14px;
    margin:        0 0 6px;

    // Colour-keyed to the bands drawn on the canvas: amber = margin, teal = padding.
    &--margin,
    &--padding {
      align-items: center;
      display:     flex;
      gap:         6px;

      &::before {
        border-radius: 2px;
        content:       '';
        height:        9px;
        width:         9px;
      }
    }

    &--margin::before {
      background: rgba(247, 181, 0, 0.9);
    }

    &--padding::before {
      background: rgba(0, 170, 90, 0.9);
    }
  }

  &__selected {
    background:    color-mix(in srgb, var(--primary) 12%, transparent);
    border-radius: 4px;
    font-size:     14px;
    line-height:   18px;
    margin:        0;
    padding:       8px 10px;
  }

  &__field {
    background:    var(--body-bg);
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    box-sizing:    border-box;
    color:         var(--body-text);
    font-size:     14px;
    height:        32px;
    padding:       0 10px;
    width:         100%;

    &--num {
      text-align: center;
      width:      100%;
    }
  }

  &__tiles {
    display:        flex;
    flex-direction: column;
    gap:            6px;
  }

  // One setting: its label, then the control. The 6px between them comes from the label's own
  // margin, so it stays independent of the gap BETWEEN settings.
  &__control {
    display:        flex;
    flex-direction: column;
  }

  // A SEGMENTED CONTROL: one track, the options a pixel apart inside it, exactly one filled. Same
  // component as the view tabs in the bar, one size down.
  &__seg {
    align-items:   center;
    align-self:    flex-start;
    background:    var(--default);
    border-radius: 4px;
    display:       flex;
    gap:           1px;
    max-width:     100%;
    overflow:      hidden;
  }

  &__pill {
    background:    transparent;
    border:        none;
    border-radius: 4px;
    color:         var(--body-text);
    cursor:        pointer;
    font-size:     12px;
    // Said explicitly: the shell's global button rule is 40px tall, a segment here is 24.
    height:        24px;
    line-height:   24px;
    min-height:    24px;
    padding:       0 8px;
    white-space:   nowrap;

    &:hover:not(&--on) {
      background: color-mix(in srgb, var(--primary) 12%, transparent);
    }

    &--on {
      background: var(--primary);
      color:      var(--primary-text);
    }

    &--narrow {
      min-width: 24px;
    }
  }

  // Advanced opens a further set of controls, so it is separated by a rule and titled like the
  // Add tab's section headings.
  &__advanced {
    align-items:  center;
    background:   transparent;
    border:       none;
    border-top:   1px solid var(--border);
    color:        var(--body-text);
    cursor:       pointer;
    display:      flex;
    font-size:    13px;
    font-weight:  700;
    gap:          8px;
    line-height:  16px;
    min-height:   0;
    padding:      12px 0 0;
    width:        100%;

    i {
      font-size: 16px;
    }
  }

  &__sides {
    display:               grid;
    gap:                   8px;
    grid-template-columns: repeat(4, minmax(0, 1fr));

    label {
      display:        flex;
      flex-direction: column;
      gap:            3px;
    }

    span {
      color:       var(--muted);
      font-size:   12px;
      line-height: 12px;
      text-align:  center;
    }
  }

  &__row {
    align-items: center;
    display:     flex;
    gap:         8px;

    .evs__field--num {
      width: 72px;
    }
  }

  &__wide {
    width: 100%;
  }

  // ---- the new-view card ----
  // The design's own numbers: a 4px card, 12px inside it, 8px between its parts, and it sits in the
  // body's 10px rhythm like everything else rather than carrying a margin of its own.
  &__new {
    background:     var(--body-bg);
    border:         1px solid var(--border);
    border-radius:  4px;
    display:        flex;
    flex-direction: column;
    gap:            8px;
    padding:        12px;
  }

  &__new-title {
    font-size:   14px;
    font-weight: 700;
    line-height: 17px;
    margin:      0;
  }

  &__chips {
    display:   flex;
    flex-wrap: wrap;
    gap:       6px;
  }

  // A 24px pill: 12px label, 4/10 inside, the drawer's own hairline round it. The shell's global
  // .btn rule is why the height is stated three ways.
  &__chip {
    background:    transparent;
    border:        1px solid var(--border);
    border-radius: 12px;
    box-sizing:    border-box;
    color:         var(--link);
    cursor:        pointer;
    font-size:     12px;
    height:        24px;
    line-height:   14px;
    min-height:    24px;
    // A long view name is cut short rather than running out of the drawer; the tooltip has it whole
    max-width:     200px;
    overflow:      hidden;
    padding:       4px 10px;
    text-overflow: ellipsis;
    white-space:   nowrap;

    &:hover {
      border-color: var(--primary);
    }
  }

  &__danger {
    color: var(--error);
  }
}

// The shell's app header is a stacking context at z-index 14, and the user menu, the notification
// tray and every other header dropdown live INSIDE it. So anything on the page at 14 or above does
// not merely sit beside them — it covers the whole header, menus and all. Page chrome stays below
// that ceiling; it only ever needs to beat the page, never the app.
</style>
