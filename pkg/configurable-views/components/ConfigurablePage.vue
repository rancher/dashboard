<script setup lang="ts">
import {
  computed, onBeforeUnmount, ref, watch, type Component
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import WidgetGrid from './WidgetGrid.vue';
import ViewBar from './ViewBar.vue';
import EditViewSidebar from './EditViewSidebar.vue';
import WidgetSettingsModal from './WidgetSettingsModal.vue';
import UndoGrowl from './UndoGrowl.vue';
import { useConfirm } from '../composables/useConfirm';
import { viewBarLocked, viewBarVisible } from '../composables/useViewBarVisibility';
import { useViewSet } from '../composables/useViewSet';
import { useEditSession } from '../composables/useEditSession';
import { useViewActions } from '../composables/useViewActions';
import { useGridEditing } from '../composables/useGridEditing';
import type { PageKey } from '../templating/template-engine';

// A configurable PAGE: the Home, or a cluster's dashboard. It holds that page's views, and one of
// them is the page Rancher already had, rendered as itself.
//
//   VIEW      one named dashboard — "Cluster overview", "Upgrade week". Views are the tabs in the
//              bar at the top, and each is edited, renamed, duplicated and deleted on its own.
//   WIDGET     one building block on a view's grid (a table, a cluster's capacity, a links box),
//              sized in twelfths and configured in place through its ⚙.
//
// A view is a FLAT, ordered list of widgets that wrap onto lines — there are no rows to manage.
//
// WHERE VIEWS LIVE. Your views are saved to YOUR account; the ones an admin publishes live in the
// organization's scope and appear in the same bar. Editing one of those does not change what
// everyone else sees — it forks the view into your account first, which is what lets the editing
// bar promise "Changes are saved to your account only" without an asterisk. Publishing is the
// separate, deliberate step in a tab's menu.
//
// Edits are a DRAFT: nothing is written until Save.
//
// The page is four parts over one set of views: the views themselves and which is open (useViewSet),
// editing them (useEditSession), the bar's actions on them (useViewActions), and the open view's grid
// (useGridEditing). This component wires them to the bar, the grid and the drawer.

defineOptions({
  name:         'ConfigurableViewsPage',
  // Two roots in stock mode (the bar and the page), so the router-view's attrs - `class="outlet"` -
  // are placed by hand: on the stock page itself, or on the configurable surface. See showsStockPage.
  inheritAttrs: false,
});

const props = defineProps<{
  /** Which page this is - where its views are stored. */
  page: PageKey;
  /** Rancher's own page, kept as a view and rendered as itself. */
  stock: Component;
  /** What the bar calls the page. */
  title: string;
  /**
   * Which layout the page sits in. The home layout takes the global outlet padding back with a
   * scoped rule this component has to restate (see the styles); the default layout does not, and a
   * page there keeps its padding.
   */
  layout: 'home' | 'default';
  /** The name a first view gets when you start editing with none. */
  firstViewName: string;
}>();

const store = useStore();
const { t } = useI18n(store);
const confirm = useConfirm();

const bar = ref<InstanceType<typeof ViewBar> | null>(null);
const grid = ref<InstanceType<typeof WidgetGrid> | null>(null);

const vs = useViewSet(props, store, t);
const {
  loaded, editing, activeViewId, selectedNodeId, startedFrom, settingsAnchor, saving, drawerOpen, error,
  templatingEnabled, defaultViewId, views, publishedIds, activeView, isNewView, activeIsStock, widgets, gap, dirty,
} = vs;

const {
  enterEdit, leaveEdit, cancelEdit, save, saveAsNewView, renameView, newView, startingPoints, startFrom,
} = useEditSession(vs, props, store, t, confirm);

const {
  renameStoredView, duplicateView, setDefaultView, reorderViews, publishView, unpublishView, deleteView, undo, closeUndo, runUndo,
} = useViewActions(vs, props, store, t, confirm, bar, leaveEdit);

const {
  selectedNode, settingsNode, flash, surfaceStyle, addFromCatalog, onCatalogDragStart, onCatalogDragEnd,
  setSelectedWidth, setSelectedHeight, setSelectedSpacing, setGap, setPagePadding, closeSettings, applySettings, removeConfigured,
} = useGridEditing(vs, t);

vs.load();

// While editing, the whole column around the grid - its padding, the room below it - is somewhere
// to drop: a drag over it is the grid's. The grid stops the ones over itself before they get here.
function dragOverPage(ev: DragEvent): void {
  if (editing.value) {
    grid.value?.onDragOver(ev);
  }
}

function dropOnPage(ev: DragEvent): void {
  if (editing.value) {
    grid.value?.onDrop(ev);
  }
}

const hasContent = computed(() => activeIsStock.value || widgets.value.length > 0);

/**
 * True when what is on screen is the stock page - and then it is rendered exactly as Rancher renders it.
 *
 * Not wrapped. The stock page is the router's outlet: it takes `class="outlet"` and sits straight in
 * <main>, with nothing around it. Rendered inside this component's layout it was none of that - four
 * wrappers deep, with the view's spacing applied to it, 20px in, 20px down and 40px narrower than
 * the real thing. So in this state the component renders the bar and then the stock page with our
 * attrs on it, which makes its root the outlet exactly as stock. The bar is the only addition.
 *
 * Covers every way of arriving at the stock page: the stock view chosen, the feature switched off,
 * no view applied, or an empty one. Editing is the exception - that is our own page, the stock one
 * shown inside it only so there is something to look at beside the drawer.
 */
const showsStockPage = computed(() => loaded.value && !editing.value && (activeIsStock.value || !(templatingEnabled.value && activeView.value && hasContent.value)));

// The bar renders in both layouts, so what it is given is written once.
const barProps = computed(() => ({
  views:        views.value,
  activeId:     activeViewId.value,
  editing:      editing.value,
  isNew:        isNewView.value,
  defaultId:    defaultViewId.value,
  publishedIds: publishedIds.value,
  dirty:        dirty.value,
  saving:       saving.value,
  startedFrom:  startedFrom.value,
  drawerOpen:   drawerOpen.value,
}));

// Hidden until asked for from the header, but always there while editing: its buttons are the way out,
// so the header's toggle is locked until the editor closes.
const showBar = computed(() => templatingEnabled.value && (viewBarVisible.value || editing.value));

watch(editing, (on) => {
  viewBarLocked.value = on;
});

onBeforeUnmount(() => {
  viewBarLocked.value = false;
});

const barListeners = {
  select: vs.setActiveView,
  // From a tab's menu: that view is opened, then edited. Rancher's own page has nothing to edit, so
  // its menu does not offer to.
  edit:   (id: string) => {
    vs.setActiveView(id);
    if (!activeIsStock.value) {
      enterEdit();
    }
  },
  cancel:          cancelEdit,
  save:            () => save(),
  'save-as-new':   saveAsNewView,
  'toggle-drawer': () => {
    drawerOpen.value = !drawerOpen.value;
  },
  rename:        renameView,
  'rename-view': renameStoredView,
  'new-view':    newView,
  duplicate:     duplicateView,
  'set-default': setDefaultView,
  publish:       publishView,
  unpublish:     unpublishView,
  delete:        deleteView,
  reorder:       reorderViews,
};
</script>

<template>
  <!-- The stock page, as Rancher renders it: the bar, then the real page with nothing around
     it. See showsStockPage. -->
  <template v-if="showsStockPage">
    <ViewBar
      v-if="showBar"
      ref="bar"
      v-bind="barProps"
      v-on="barListeners"
    />
    <p
      v-if="error"
      class="ai-home__error"
    >
      {{ error }}
    </p>
    <component
      :is="stock"
      v-bind="$attrs"
      :class="{ 'view-host__unpadded': layout === 'home' }"
    />
    <UndoGrowl
      v-if="undo"
      :title="undo.title"
      :message="undo.message"
      @undo="runUndo"
      @close="closeUndo"
    />
  </template>

  <div
    v-else
    v-bind="$attrs"
    class="ai-home view-host__unpadded"
    :class="{ 'ai-home--editing': editing }"
  >
    <ViewBar
      v-if="loaded && showBar"
      ref="bar"
      v-bind="barProps"
      v-on="barListeners"
    />

    <p
      v-if="error"
      class="ai-home__error"
    >
      {{ error }}
    </p>

    <!-- While editing the page splits: the view keeps the full width it will really have, and every
       control lives in the drawer beside it. -->
    <div class="ai-home__layout">
      <div
        class="ai-home__main"
        @dragover="dragOverPage"
        @drop="dropOnPage"
      >
        <!-- A view of widgets, or the edit surface. Outside editing, the stock page never reaches
         this branch - it renders as itself, above. -->
        <div
          v-if="loaded && templatingEnabled && activeView && (editing || hasContent)"
          class="ai-home__surface"
          :style="surfaceStyle"
        >
          <!-- Editing a STOCK view: there is nothing to edit, but the drawer is open beside it. -->
          <component
            :is="stock"
            v-if="activeIsStock"
          />
          <WidgetGrid
            v-else
            ref="grid"
            :key="activeView.id"
            :widgets="widgets"
            :editing="editing"
            :selected-id="selectedNodeId"
            :gap="gap"
            :flash-gap="flash === 'gap'"
          />
        </div>
        <component
          :is="stock"
          v-else-if="loaded"
        />
      </div>

      <EditViewSidebar
        v-if="editing && drawerOpen"
        :view="activeView"
        :selected="selectedNode"
        :is-default="activeViewId === defaultViewId"
        :is-stock="activeIsStock"
        :is-new="isNewView"
        :started-from="startedFrom"
        :starting-points="startingPoints"
        @close="drawerOpen = false"
        @add="addFromCatalog"
        @drag-start="onCatalogDragStart"
        @drag-end="onCatalogDragEnd"
        @start-from="startFrom"
        @set-width="setSelectedWidth"
        @set-height="setSelectedHeight"
        @set-spacing="setSelectedSpacing"
        @set-gap="setGap"
        @set-page-padding="setPagePadding"
        @set-name="renameView"
        @set-default="activeViewId && setDefaultView(activeViewId)"
        @publish="activeViewId && publishView(activeViewId)"
        @delete="activeViewId && deleteView(activeViewId)"
      />
    </div>

    <WidgetSettingsModal
      v-if="settingsNode"
      :key="settingsNode.id"
      :widget="settingsNode.widget"
      :anchor="settingsAnchor"
      @done="applySettings"
      @cancel="closeSettings"
      @remove="removeConfigured"
    />
    <UndoGrowl
      v-if="undo"
      :title="undo.title"
      :message="undo.message"
      @undo="runUndo"
      @close="closeUndo"
    />
  </div>
</template>

<style lang="scss" scoped>
// Which root takes the page padding.
//
// The router-view gives its page `class="outlet"`, and a global `.outlet` rule pads it 24px. The
// home layout takes that back with a SCOPED rule of its own - `main .outlet { padding: 0 }` in
// templates/home.vue - and a scoped rule reaches only a page that is the router-view's single root,
// which this component, two levels down and sometimes rendering two roots, never is. The default
// layout (a cluster's dashboard) has no such rule: its pages keep the 24px as their own.
//
// So, restated here, where this component's own scope attribute does reach:
//
//   the stock page         padded exactly as its layout pads it: unpadded on the Home, Rancher's
//                          own 24px on a cluster's dashboard.
//   the configurable page  never padded. The bar spans the page the same way on every tab, so it
//                          does not move when you switch from the stock tab to one of yours; the
//                          grid is inset by the view's own spacing setting (see surfaceStyle).
.view-host__unpadded {
  padding: 0;
}

.ai-home {
  &--editing {
    min-height: calc(100vh - var(--header-height, 54px));
  }

  // The bar spans the whole page — it belongs to the Home, not to the column beside the drawer —
  // and the split below it is the grid and the drawer.
  &__layout {
    display: block;
  }

  &--editing &__layout {
    align-items: flex-start;
    display:     flex;
  }

  &__main {
    min-width: 0;
  }

  // Down to the foot of the page, so the room below the grid takes a drop too
  &--editing &__main {
    align-self: stretch;
    flex:       1 1 auto;
  }

  // The space around the grid is a per-view setting (see `surfaceStyle`), applied in BOTH modes so
  // a view looks the same whether or not you are editing it.
  &__surface {
    box-sizing: border-box;
    transition: box-shadow 0.2s ease-out;
  }

  &__error {
    color:     var(--error);
    font-size: 13px;
    margin:    8px 20px 0;
  }
}
</style>
