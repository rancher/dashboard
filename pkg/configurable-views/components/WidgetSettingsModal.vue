<script setup lang="ts">
import {
  computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, type CSSProperties
} from 'vue';
import { useStore } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { FIELDS, typeColumns, clusterOptions } from '../templating/widget-data';
import { newId } from '../templating/view-model';
import {
  SUGGESTED_RESOURCES, blockName, isDownstream, isClusterWidget, WIDGET_TABLE, WIDGET_LINKS,
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
// fields shown depend on the building block: a table needs a resource, columns and a sort; a links
// box needs links; a cluster widget needs only its cluster; a Tabs widget needs its tabs.

// Block names that are plural, where "what this <name> shows" does not read.
const PLURAL_NAMES = ['links', 'tabs'];

const DIALOG_WIDTH = 400;
const MARGIN = 12;

/** One tickable column: an id, how it is labelled, and whether it can be sorted by. */
interface ColumnOption {
  id: string;
  label: string;
  sortable: boolean;
}

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
  const name = blockName(draft.kind);
  const what = PLURAL_NAMES.includes(name.toLowerCase()) ? 'widget' : name.toLowerCase();

  return `${ draft.title || name }: what this ${ what } shows`;
});

// Which sections apply to this building block.
const readsData = computed(() => ![WIDGET_LINKS, WIDGET_BANNER, WIDGET_CLUSTER_TABLE, WIDGET_OVERVIEW, WIDGET_TABS].includes(draft.kind) && !isClusterWidget(draft.kind));

// The Home cluster table is the stock Home's own table — its columns, sorting and actions are fixed
// there, so there is nothing here to change but the heading.
const titleOnly = computed(() => draft.kind === WIDGET_CLUSTER_TABLE);

const hasColumns = computed(() => draft.kind === WIDGET_TABLE);
const hasSort = computed(() => draft.kind === WIDGET_TABLE);

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

/**
 * The columns on offer belong to the RESOURCE, not to these settings: a User has a username and a last
 * login, a Cluster has a provider and a Kubernetes version. So the ticks are rebuilt from whatever
 * type the picker is currently pointing at, and only a type Rancher describes nothing about falls
 * back to the generic field list.
 */
const columns = computed<ColumnOption[]>(() => {
  const own = typeColumns(store.getters, draft.resource);

  return own.length ? own : FIELDS.map((f) => ({
    id: f.id, label: f.label, sortable: true
  }));
});

// A table sorts through the column itself, so it can only offer the ones the type says are sortable.
const sortFields = computed<ColumnOption[]>(() => {
  const sortable = columns.value.filter((c) => c.sortable);

  return sortable.length ? sortable : FIELDS.map((f) => ({
    id: f.id, label: f.label, sortable: true
  }));
});

// The suggested list, plus whatever this widget already points at (which may be a CRD that is not on
// the list) so the picker never silently drops it.
const resourceOptions = computed<SuggestedResource[]>(() => {
  const known = SUGGESTED_RESOURCES.some((r) => r.value === draft.resource);

  return known || !draft.resource ? SUGGESTED_RESOURCES : [{ value: draft.resource, label: draft.resource }, ...SUGGESTED_RESOURCES];
});

const targetsText = computed({
  get: () => (draft.targets || []).join(', '),
  set: (value: string) => {
    draft.targets = `${ value }`.split(',').map((t) => t.trim()).filter(Boolean);
  },
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
    id: newId('tab'), name: `Tab ${ tabs.length + 1 }`, widgets: []
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
  return count ? `Remove this tab and the ${ count } widget${ count === 1 ? '' : 's' } in it` : 'Remove this tab';
}

function hasColumn(id: string): boolean {
  return (draft.columns || []).includes(id);
}

function toggleColumn(id: string): void {
  const next = [...(draft.columns || [])];
  const at = next.indexOf(id);

  if (at >= 0) {
    next.splice(at, 1);
  } else {
    // Keep the canonical field order so the table reads the same however they were ticked.
    next.push(id);
    next.sort((a, b) => columns.value.findIndex((c) => c.id === a) - columns.value.findIndex((c) => c.id === b));
  }

  draft.columns = next;
}

// A widget that has never been configured has no `columns`, and the table reads that as "show
// everything". Materialise it here so the ticks match what is actually drawn — otherwise the settings
// opens with nothing ticked beside a table showing every column, and ticking one box would read as
// "add a column" while actually dropping the other eight.
if (hasColumns.value && !draft.columns?.length) {
  draft.columns = columns.value.map((c) => c.id);
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

/**
 * Changing the type changes what a column even means — `user-id` is not a column a Cluster has — so
 * the old ticks cannot carry over. Everything the new type has is ticked: you drop what you do not
 * want, rather than hunt for what you do. A sort that no longer applies is cleared.
 */
watch(() => draft.resource, (neu, old) => {
  if (neu === old) {
    return;
  }

  draft.columns = columns.value.map((c) => c.id);

  if (draft.sortBy && !sortFields.value.some((f) => f.id === draft.sortBy)) {
    draft.sortBy = '';
  }
});

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
    aria-label="Widget settings"
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
          title="Close"
          aria-label="Close"
          @click="$emit('cancel')"
        >
          <i class="icon icon-close" />
        </button>
      </header>

      <div class="wsm__body">
        <label class="wsm__label">Title</label>
        <input
          v-model="draft.title"
          class="wsm__field"
        >
        <p
          v-if="titleOnly"
          class="wsm__hint"
        >
          This is the Home's own cluster table — its columns, sorting and buttons come with it.
        </p>

        <template v-if="readsData">
          <label class="wsm__label">Resource</label>
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
            Any kind Rancher knows, including your own CRDs.
          </p>

          <label class="wsm__label">Where</label>
          <label class="wsm__radio">
            <input
              v-model="draft.where"
              type="radio"
              value="view"
            >
            Same as the view (all clusters I can see)
          </label>
          <label class="wsm__radio">
            <input
              v-model="draft.where"
              type="radio"
              value="custom"
            >
            Only these clusters or namespaces
          </label>
          <input
            v-if="draft.where === 'custom'"
            v-model="targetsText"
            class="wsm__field"
            placeholder="prod-eu-1, prod-us-2"
          >

          <label class="wsm__label">Filter</label>
          <input
            v-model="draft.filter"
            class="wsm__field"
            placeholder="state != Active"
          >
          <p class="wsm__hint">
            Labels or fields, such as env=prod or state != Active.
          </p>
        </template>

        <template v-if="needsClusters">
          <label class="wsm__label">Cluster</label>
          <select
            v-model="draft.cluster"
            class="wsm__field"
          >
            <option value="">
              This page's cluster
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
            One cluster per widget. "This page's cluster" shows whichever cluster's dashboard it is
            placed on — the Home has none, so pick one here.
          </p>
        </template>

        <template v-if="hasColumns">
          <label class="wsm__label">Columns</label>
          <div class="wsm__columns">
            <label
              v-for="column in columns"
              :key="column.id"
            >
              <input
                type="checkbox"
                :checked="hasColumn(column.id)"
                @change="toggleColumn(column.id)"
              >
              {{ column.label }}
            </label>
          </div>
          <p class="wsm__hint">
            Columns appear in this order. Untick one to drop it from the table.
          </p>
        </template>

        <template v-if="hasSort">
          <label class="wsm__label">Sort by</label>
          <div class="wsm__pair">
            <select
              v-model="draft.sortBy"
              class="wsm__field"
            >
              <option value="">
                Nothing
              </option>
              <option
                v-for="field in sortFields"
                :key="field.id"
                :value="field.id"
              >
                {{ field.label }}
              </option>
            </select>
            <select
              v-model="draft.sortDir"
              class="wsm__field"
            >
              <option value="asc">
                Ascending
              </option>
              <option value="desc">
                Descending
              </option>
            </select>
          </div>
        </template>

        <template v-if="draft.kind === 'links'">
          <label class="wsm__label">Show</label>
          <label class="wsm__radio">
            <input
              v-model="draft.source"
              type="radio"
              value="home"
            >
            Rancher's own links, as the Home shows them
          </label>
          <label class="wsm__radio">
            <input
              v-model="draft.source"
              type="radio"
              value="custom"
            >
            My own list
          </label>
          <p class="wsm__hint">
            Rancher's list follows the ui-custom-links setting, so it stays in step with the Home.
          </p>

          <template v-if="draft.source === 'custom'">
            <label class="wsm__label">Links</label>
            <textarea
              v-model="linksText"
              class="wsm__field wsm__field--area"
              rows="6"
              placeholder="Runbook https://wiki.example.com/runbook"
            />
            <p class="wsm__hint">
              One per line: the label, then the URL.
            </p>
          </template>
        </template>

        <template v-if="draft.kind === 'banner'">
          <label class="wsm__label">Subtitle</label>
          <input
            v-model="draft.subtitle"
            class="wsm__field"
          >
          <label class="wsm__label">Background image</label>
          <input
            v-model="draft.image"
            class="wsm__field"
            placeholder="Leave empty for the Rancher banner"
          >
        </template>

        <template v-if="draft.kind === 'tabs'">
          <label class="wsm__label">Tabs</label>
          <div
            v-for="(tab, i) in draft.tabs"
            :key="tab.id"
            class="wsm__tabrow"
          >
            <input
              v-model="tab.name"
              class="wsm__field"
              :aria-label="`Name of tab ${ i + 1 }`"
            >
            <button
              class="wsm__icon"
              title="Move left"
              aria-label="Move left"
              :disabled="i === 0"
              @click="moveTab(i, -1)"
            >
              <i class="icon icon-chevron-left" />
            </button>
            <button
              class="wsm__icon"
              title="Move right"
              aria-label="Move right"
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
            Add tab
          </button>
          <p class="wsm__hint">
            Put widgets in a tab on the view itself: drag them into it while editing. Removing a tab
            removes what is in it.
          </p>
        </template>


        <footer class="wsm__foot">
          <button
            class="btn btn-sm role-secondary"
            @click="$emit('remove')"
          >
            Remove from view
          </button>
          <button
            class="btn btn-sm role-primary"
            @click="$emit('done', draft)"
          >
            Done
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
