<script setup lang="ts">
import {
  computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, type CSSProperties
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { MANAGEMENT } from '@shell/config/types';
import { clusterOptions, METRICS_DASHBOARDS } from '../templating/widget-data';
import { newId } from '../templating/view-model';
import {
  SUGGESTED_RESOURCES, blockLabelKey, isDownstream, isClusterWidget, WIDGET_TABLE, WIDGET_LINKS,
  WIDGET_BANNER, WIDGET_CLUSTER_TABLE, WIDGET_OVERVIEW, WIDGET_TABS, type SuggestedResource
} from '../templating/widget-catalog';
import type { SettingsAnchor } from '../composables/viewEditor';
import type { WidgetLink, WidgetSpec } from '../templating/types';

// "What this widget shows" — the settings behind a widget's ⚙.
//
// IN PLACE, deliberately: it opens beside the widget it belongs to, over a page that stays lit,
// because the thing you are describing is right there and you want to keep seeing it. A centred
// modal over a dimmed page would hide exactly what you are configuring.
//
// It edits a COPY and only hands it back on Done, so Cancel really does leave the widget alone. The
// fields shown depend on the building block: a table needs a resource (and its cluster, for a type
// that lives once per cluster) and how much of the table views it shows - its columns, sort and filter
// are set in the table itself; a links box needs links; a cluster widget needs only its cluster; a
// Tabs widget needs its tabs.

// Building blocks with plural names, where "what this <name> shows" does not read.
const PLURAL_KINDS = [WIDGET_LINKS, WIDGET_TABS];

const DIALOG_WIDTH = 400;
const MARGIN = 12;

/** One tickable column: an id, how it is labelled, and whether it can be sorted by. */

const props = withDefaults(defineProps<{
  widget: WidgetSpec;
  /** Where on screen the widget sits, so the settings can open next to it. */
  anchor?: SettingsAnchor | null;
}>(), { anchor: null });

type SettingsEmits = {
  done: [widget: WidgetSpec];
  cancel: [];
  remove: [];
};

const emit = defineEmits<SettingsEmits>();

const store = useStore();
const { t } = useI18n(store);

const root = ref<HTMLElement | null>(null);
const dialog = ref<HTMLElement | null>(null);
// Measured after mount: the dialog can only be placed well if we know how tall it really is.
const dialogHeight = ref(0);
const draft = reactive<WidgetSpec>(JSON.parse(JSON.stringify(props.widget)));

/**
 * Sit against the widget's left edge, and ALWAYS fully on screen.
 *
 * The anchor is where the widget is, and for a widget near the bottom of a long page that is a point
 * with no room under it. So the dialog is placed against the anchor and then pushed back up by
 * however much of it would fall off the bottom — clamped last against the view bar, which holds
 * Cancel and Save and has to stay reachable while this is open.
 */
const position = computed<CSSProperties>(() => {
  const a = props.anchor;
  const bar = document.querySelector('.vbar');
  const floor = bar ? Math.round(bar.getBoundingClientRect().bottom) + 8 : MARGIN;
  const ceiling = Math.max(floor, window.innerHeight - (dialogHeight.value || 420) - MARGIN);

  if (!a) {
    return {
      left: '50%', top: `${ floor }px`, transform: 'translateX(-50%)'
    };
  }

  return {
    left: `${ Math.max(MARGIN, Math.min(a.left, window.innerWidth - DIALOG_WIDTH - MARGIN)) }px`,
    top:  `${ Math.max(floor, Math.min(a.top, ceiling)) }px`,
  };
});

// "Clusters: what this table shows" — the widget's own title, then what kind of thing it is. A
// plural block name ("Links") does not fit that sentence, so it falls back to the generic noun
// rather than reading "what this links shows".
const heading = computed(() => {
  const key = blockLabelKey(draft.kind);
  const name = key ? t(key) : draft.kind;

  return PLURAL_KINDS.includes(draft.kind) ? t('configurableViews.widgetSettings.headingPlural', { title: draft.title || name }) : t('configurableViews.widgetSettings.heading', { title: draft.title || name, what: name.toLowerCase() });
});

// Which sections apply to this building block.
const readsData = computed(() => ![WIDGET_LINKS, WIDGET_BANNER, WIDGET_CLUSTER_TABLE, WIDGET_OVERVIEW, WIDGET_TABS].includes(draft.kind) && !isClusterWidget(draft.kind));

// The Home cluster table is the stock Home's own table — its columns, sorting and actions are fixed
// there, so there is nothing here to change but the heading.
const titleOnly = computed(() => draft.kind === WIDGET_CLUSTER_TABLE);

const isTable = computed(() => draft.kind === WIDGET_TABLE);

/**
 * A Kubernetes type exists once per CLUSTER, and a cluster widget is about one, so either has a
 * cluster to name. Asking only then keeps the question off the widgets that do not have it — a
 * Cluster or a User is global, there is nothing to pick.
 *
 * ONE cluster, not several: each is a separate API with its own paging, so a widget spanning two of
 * them could not be paged at all. One cluster is what makes a table a real table.
 */
const needsClusters = computed(() => (readsData.value && isDownstream(draft.resource)) || isClusterWidget(draft.kind));

const clusters = computed(() => clusterOptions(store.getters));

// The suggested list, plus whatever this widget already points at (which may be a CRD that is not on
// the list) so the picker never silently drops it.
const resourceOptions = computed<SuggestedResource[]>(() => {
  const known = SUGGESTED_RESOURCES.some((r) => r.value === draft.resource);

  return known || !draft.resource ? SUGGESTED_RESOURCES : [{ value: draft.resource, label: draft.resource }, ...SUGGESTED_RESOURCES];
});

// One link per line, "Label https://url" - the URL is whatever follows the last space.
const linksText = computed({
  get: () => (draft.links || []).map((l) => `${ l.label } ${ l.url }`).join('\n'),
  set: (value: string) => {
    draft.links = `${ value }`.split('\n').map((line): WidgetLink | null => {
      const at = line.trim().lastIndexOf(' ');

      return at < 0 ? null : { label: line.trim().slice(0, at).trim(), url: line.trim().slice(at + 1).trim() };
    }).filter((l): l is WidgetLink => !!l && !!l.label && !!l.url);
  },
});

// ---- a Tabs widget's tabs ----
// Only the tabs themselves are edited here - their names and order. What is IN a tab is edited on
// the view, where it is drawn.

function addTab(): void {
  const tabs = draft.tabs || [];

  draft.tabs = [...tabs, {
    id: newId('tab'), name: t('configurableViews.widgetSettings.newTab', { index: tabs.length + 1 }), widgets: []
  }];
}

function moveTab(index: number, delta: number): void {
  const tabs = [...(draft.tabs || [])];
  const to = index + delta;

  if (to < 0 || to >= tabs.length) {
    return;
  }

  const [moved] = tabs.splice(index, 1);

  tabs.splice(to, 0, moved);
  draft.tabs = tabs;
}

// A tab goes with what is in it; the button says so before it is pressed, and Cancel still undoes it.
function removeTab(index: number): void {
  draft.tabs = (draft.tabs || []).filter((_, i) => i !== index);
}

function removeTabLabel(count: number): string {
  return count ? t('configurableViews.widgetSettings.removeTabWith', { count }) : t('configurableViews.widgetSettings.removeTab');
}

/**
 * Load the clusters the picker offers, the moment it is shown.
 *
 * The picker reads them from the store, and nothing on the Home is obliged to have put them there -
 * the cluster list pages, so it holds one page of them at most, and a Home without one holds none.
 *
 * Fetched here, not on every Home load: a picker of clusters needs all of them, but only while
 * somebody is choosing one.
 */
watch(needsClusters, (needed) => {
  if (needed) {
    store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }).catch(() => undefined);
  }
}, { immediate: true });

// Escape closes it, like every other dialog in the product.
function onKey(ev: KeyboardEvent): void {
  if (ev.key === 'Escape') {
    emit('cancel');
  }
}

// Place it knowing its real height (see `position`), and keep it on screen if the window moves.
function measure(): void {
  dialogHeight.value = dialog.value?.getBoundingClientRect().height || 0;
}

// With no scrim there is nothing to click "through" to, so a click anywhere outside closes it.
function onOutside(ev: MouseEvent): void {
  if (!root.value?.contains(ev.target as Node | null)) {
    emit('cancel');
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey);
  nextTick(measure);
  window.addEventListener('resize', measure);
  // Deferred past this tick so the very click that opened it does not immediately close it.
  setTimeout(() => document.addEventListener('mousedown', onOutside), 0);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('resize', measure);
  document.removeEventListener('mousedown', onOutside);
});
</script>

<template>
  <div
    ref="root"
    class="wsm"
    :style="position"
    role="dialog"
    :aria-label="t('configurableViews.widgetSettings.label')"
  >
    <div
      ref="dialog"
      class="wsm__dialog"
    >
      <header class="wsm__head">
        <h3 class="wsm__title">
          <i class="icon icon-gear" />
          {{ heading }}
        </h3>
        <button
          class="wsm__close"
          :title="t('generic.close')"
          :aria-label="t('generic.close')"
          @click="$emit('cancel')"
        >
          <i class="icon icon-close" />
        </button>
      </header>

      <div class="wsm__body">
        <label class="wsm__label">{{ t('configurableViews.widgetSettings.title') }}</label>
        <input
          v-model="draft.title"
          class="wsm__field"
        >
        <p
          v-if="titleOnly"
          class="wsm__hint"
        >
          {{ t('configurableViews.widgetSettings.clusterTableHint') }}
        </p>

        <template v-if="readsData">
          <label class="wsm__label">{{ t('configurableViews.widgetSettings.resource') }}</label>
          <select
            v-model="draft.resource"
            class="wsm__field"
          >
            <option
              v-for="option in resourceOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <p class="wsm__hint">
            {{ t('configurableViews.widgetSettings.resourceHint') }}
          </p>
        </template>

        <template v-if="needsClusters">
          <label class="wsm__label">{{ t('configurableViews.widgetSettings.cluster') }}</label>
          <select
            v-model="draft.cluster"
            class="wsm__field"
          >
            <option value="">
              {{ t('configurableViews.widgetSettings.pageCluster') }}
            </option>
            <option
              v-for="cluster in clusters"
              :key="cluster.id"
              :value="cluster.id"
            >
              {{ cluster.label }}
            </option>
          </select>
          <p class="wsm__hint">
            {{ t('configurableViews.widgetSettings.clusterHint') }}
          </p>
        </template>

        <!-- Columns, sort, filter and grouping are the table views', set in the table itself -->
        <template v-if="isTable">
          <label class="wsm__label">{{ t('configurableViews.widgetSettings.views') }}</label>
          <label class="wsm__radio">
            <input
              v-model="draft.viewTabs"
              type="checkbox"
              data-testid="configurable-views-table-view-tabs"
            >
            {{ t('configurableViews.widgetSettings.viewTabs') }}
          </label>
          <label class="wsm__radio">
            <input
              v-model="draft.ownViews"
              type="checkbox"
              :disabled="!draft.viewTabs"
              data-testid="configurable-views-table-own-views"
            >
            {{ t('configurableViews.widgetSettings.ownViews') }}
          </label>
          <p class="wsm__hint">
            {{ t('configurableViews.widgetSettings.viewsHint') }}
          </p>
        </template>

        <template v-if="draft.kind === 'links'">
          <label class="wsm__label">{{ t('configurableViews.widgetSettings.show') }}</label>
          <label class="wsm__radio">
            <input
              v-model="draft.source"
              type="radio"
              value="home"
            >
            {{ t('configurableViews.widgetSettings.linksHome') }}
          </label>
          <label class="wsm__radio">
            <input
              v-model="draft.source"
              type="radio"
              value="custom"
            >
            {{ t('configurableViews.widgetSettings.linksCustom') }}
          </label>
          <p class="wsm__hint">
            {{ t('configurableViews.widgetSettings.linksHomeHint') }}
          </p>

          <template v-if="draft.source === 'custom'">
            <label class="wsm__label">{{ t('configurableViews.widgetSettings.links') }}</label>
            <textarea
              v-model="linksText"
              class="wsm__field wsm__field--area"
              rows="6"
              placeholder="Runbook https://wiki.example.com/runbook"
            />
            <p class="wsm__hint">
              {{ t('configurableViews.widgetSettings.linksHint') }}
            </p>
          </template>
        </template>

        <template v-if="draft.kind === 'banner'">
          <label class="wsm__label">{{ t('configurableViews.widgetSettings.subtitle') }}</label>
          <input
            v-model="draft.subtitle"
            class="wsm__field"
          >
          <label class="wsm__label">{{ t('configurableViews.widgetSettings.image') }}</label>
          <input
            v-model="draft.image"
            class="wsm__field"
            :placeholder="t('configurableViews.widgetSettings.imagePlaceholder')"
          >
        </template>

        <template v-if="draft.kind === 'clusterMetrics'">
          <label class="wsm__label">{{ t('configurableViews.widgetSettings.dashboard') }}</label>
          <select
            v-model="draft.metrics"
            class="wsm__field"
          >
            <option
              v-for="(board, id) in METRICS_DASHBOARDS"
              :key="id"
              :value="id"
            >
              {{ t(board.labelKey) }}
            </option>
          </select>
          <p class="wsm__hint">
            {{ t('configurableViews.widgetSettings.dashboardHint') }}
          </p>
        </template>

        <template v-if="draft.kind === 'tabs'">
          <label class="wsm__label">{{ t('configurableViews.widgetSettings.tabs') }}</label>
          <div
            v-for="(tab, i) in draft.tabs"
            :key="tab.id"
            class="wsm__tabrow"
          >
            <input
              v-model="tab.name"
              class="wsm__field"
              :aria-label="t('configurableViews.widgetSettings.tabName', { index: i + 1 })"
            >
            <button
              class="wsm__icon"
              :title="t('configurableViews.widgetSettings.moveLeft')"
              :aria-label="t('configurableViews.widgetSettings.moveLeft')"
              :disabled="i === 0"
              @click="moveTab(i, -1)"
            >
              <i class="icon icon-chevron-left" />
            </button>
            <button
              class="wsm__icon"
              :title="t('configurableViews.widgetSettings.moveRight')"
              :aria-label="t('configurableViews.widgetSettings.moveRight')"
              :disabled="i === (draft.tabs || []).length - 1"
              @click="moveTab(i, 1)"
            >
              <i class="icon icon-chevron-right" />
            </button>
            <button
              class="wsm__icon wsm__icon--danger"
              :title="removeTabLabel(tab.widgets.length)"
              :aria-label="removeTabLabel(tab.widgets.length)"
              :disabled="(draft.tabs || []).length < 2"
              @click="removeTab(i)"
            >
              <i class="icon icon-close" />
            </button>
          </div>
          <button
            class="btn btn-sm role-tertiary wsm__add-tab"
            @click="addTab"
          >
            <i class="icon icon-plus" />
            {{ t('configurableViews.widgetSettings.addTab') }}
          </button>
          <p class="wsm__hint">
            {{ t('configurableViews.widgetSettings.tabsHint') }}
          </p>
        </template>


        <footer class="wsm__foot">
          <button
            class="btn btn-sm role-secondary"
            @click="$emit('remove')"
          >
            {{ t('configurableViews.widgetSettings.remove') }}
          </button>
          <button
            class="btn btn-sm role-primary"
            @click="$emit('done', draft)"
          >
            {{ t('generic.done') }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 400px wide, sitting over the page rather than behind a scrim. Sizes are the design's: a 42px
// header, a 14/16/16 body whose fields are 8px apart, controls 24px tall, and a 32px footer row.
.wsm {
  position: fixed;
  // Over the grid and the drawer, still under the app header's stacking context (see the note at
  // the foot of this file).
  z-index:  12;

  &__dialog {
    background:     var(--body-bg);
    border:         1px solid var(--border);
    border-radius:  4px;
    box-shadow:     0 8px 32px rgba(0, 0, 0, 0.25);
    display:        flex;
    flex-direction: column;
    max-height:     min(86vh, 720px);
    width:          400px;
  }

  &__head {
    align-items:     center;
    border-bottom:   1px solid var(--border);
    box-sizing:      border-box;
    display:         flex;
    gap:             8px;
    height:          42px;
    padding:         12px 12px 12px 16px;
  }

  &__title {
    align-items: center;
    display:     flex;
    flex:        1 1 auto;
    font-size:   14px;
    font-weight: 700;
    gap:         8px;
    // Pinned, or the default line box makes the 42px header grow to 48.
    line-height: 17px;
    margin:      0;
    min-width:   0;
    overflow:    hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    i {
      flex:      0 0 auto;
      font-size: 16px;
    }
  }

  &__close {
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
  }

  &__body {
    display:        flex;
    flex-direction: column;
    gap:            8px;
    overflow-y:     auto;
    padding:        14px 16px 16px;

    // Same reason as the drawer: a column flex container squashes fixed-height controls before it
    // agrees to overflow, so nothing in here shrinks.
    > * {
      flex: 0 0 auto;
    }
  }

  // A field's label sits 6px above its control; the 8px between FIELDS comes from the body's gap.
  &__label {
    color:         var(--muted);
    display:       block;
    font-size:     12px;
    font-weight:   700;
    line-height:   14px;
    margin-bottom: 6px;
  }

  &__field {
    background:    var(--body-bg);
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    box-sizing:    border-box;
    color:         var(--body-text);
    font-family:   inherit;
    font-size:     14px;
    height:        24px;
    padding:       0 8px;
    width:         100%;

    &--area {
      height:  auto;
      padding: 6px 8px;
      resize:  vertical;
    }
  }

  &__hint {
    color:       var(--muted);
    font-size:   12px;
    line-height: 14px;
    margin:      6px 0 0;
  }

  &__radio {
    align-items: center;
    display:     flex;
    font-size:   14px;
    gap:         8px;
    line-height: 17px;
  }

  // Three across, as the design lays the column checkboxes out.
  &__columns {
    display:               grid;
    gap:                   4px 12px;
    grid-template-columns: repeat(3, minmax(0, 1fr));

    // Destination names are sentences, not single words.
    &--wide {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    label {
      align-items: center;
      display:     flex;
      font-size:   14px;
      gap:         6px;
    }
  }

  &__pair {
    display:               grid;
    gap:                   8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  // One row per tab: its name, then move left / right and remove.
  &__tabrow {
    align-items: center;
    display:     flex;
    gap:         4px;

    .wsm__field {
      flex: 1 1 auto;
    }
  }

  &__icon {
    align-items:     center;
    background:      transparent;
    border:          none;
    color:           var(--body-text);
    cursor:          pointer;
    display:         flex;
    font-size:       16px;
    height:          24px;
    justify-content: center;
    min-height:      0;
    padding:         0;
    width:           24px;

    &:hover:not(:disabled) {
      color: var(--link);
    }

    &--danger:hover:not(:disabled) {
      color: var(--error);
    }

    &:disabled {
      cursor:  default;
      opacity: 0.35;
    }
  }

  &__add-tab {
    align-self: flex-start;
    gap:        6px;
  }

  &__foot {
    border-top:      1px solid var(--border);
    display:         flex;
    gap:             12px;
    justify-content: flex-end;
    margin-top:      6px;
    padding-top:     12px;
  }
}

// The shell's app header is a stacking context at z-index 14, and the user menu, the notification
// tray and every other header dropdown live INSIDE it. So anything on the page at 14 or above does
// not merely sit beside them — it covers the whole header, menus and all. Page chrome stays below
// that ceiling; it only ever needs to beat the page, never the app.
</style>
