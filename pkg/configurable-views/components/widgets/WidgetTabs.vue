<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { computed, onBeforeUnmount, ref } from 'vue';
import WidgetGrid from '../WidgetGrid.vue';
import { DEFAULT_GAP } from '../../templating/view-model';
import { useViewEditor } from '../../composables/viewEditor';
import { useWidgetPresence } from '../../composables/useWidgetPresence';
import type { WidgetSpec, WidgetTab } from '../../templating/types';

// TABS — a widget that holds widgets.
//
// Each tab is a grid of its own: the same flat, wrapping list a view has, twelve columns across the
// tab's width, with the view's gap. While the view is being edited those grids are edited in place -
// drop into a tab, drag out of one, select and size what is in it - so there is no second editor to
// learn. Tabs are named, added and ordered in the widget's settings.
//
// It draws the tab strip the way the shell's Tabbed does (the cluster dashboard's Events tabs), not
// through Tabbed itself: Tabbed owns the URL hash and its tabs register as child components, and
// neither fits a strip whose tabs are data that changes while you edit it.

// Dragging something over a tab's name opens that tab after this long, so a widget can be dropped
// into a tab that is not the one showing.
const OPEN_ON_HOVER_MS = 450;

const props = withDefaults(defineProps<{
  widget: WidgetSpec;
  /** This widget's id on the grid: a drop into one of its tabs is addressed by it. */
  nodeId?: string;
  gap?: number;
}>(), { nodeId: '', gap: DEFAULT_GAP });

const store = useStore();
const { t } = useI18n(store);
const viewEditor = useViewEditor();

const { tabPresent } = useWidgetPresence();

// Outside the editor a tab with nothing to show here is left out, as the dashboard leaves out its
// Alerts tab on a cluster without monitoring. While editing, every tab is there to be filled.
const tabs = computed<WidgetTab[]>(() => (props.widget.tabs || []).filter((tab) => viewEditor.editing || tabPresent(tab.widgets.map((w) => w.widget))));
const chosenId = ref('');
// The chosen tab, or the first when it has been removed (or none has been chosen yet).
const active = computed<WidgetTab | null>(() => tabs.value.find((t) => t.id === chosenId.value) || tabs.value[0] || null);

const tabEls = ref<HTMLElement[]>([]);
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

function choose(id: string): void {
  chosenId.value = id;
}

// Arrow keys move between tabs, Home and End jump to the ends - the tablist pattern Tabbed follows.
function step(to: number | 'first' | 'last'): void {
  const list = tabs.value;
  const at = list.findIndex((t) => t.id === active.value?.id);
  let next = at;

  if (to === 'first') {
    next = 0;
  } else if (to === 'last') {
    next = list.length - 1;
  } else {
    next = (at + to + list.length) % list.length;
  }

  if (list[next]) {
    choose(list[next].id);
    tabEls.value[next]?.focus();
  }
}

function cancelHover(): void {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}

function onTabDragEnter(id: string): void {
  if (!viewEditor.editing || id === active.value?.id) {
    return;
  }
  cancelHover();
  hoverTimer = setTimeout(() => choose(id), OPEN_ON_HOVER_MS);
}

onBeforeUnmount(cancelHover);
</script>

<template>
  <div class="wtabs">
    <h3
      v-if="widget.title"
      class="wtabs__title"
    >
      {{ widget.title }}
    </h3>

    <ul
      class="wtabs__list"
      role="tablist"
      :aria-label="widget.title || t('configurableViews.widget.tabs.label')"
    >
      <li
        v-for="tab in tabs"
        :key="tab.id"
        class="wtabs__tab"
        :class="{ 'wtabs__tab--active': tab.id === active?.id }"
        role="presentation"
      >
        <a
          ref="tabEls"
          role="tab"
          :aria-selected="tab.id === active?.id"
          :tabindex="tab.id === active?.id ? 0 : -1"
          @click.prevent="choose(tab.id)"
          @keydown.enter.prevent="choose(tab.id)"
          @keydown.space.prevent="choose(tab.id)"
          @keydown.right.prevent="step(1)"
          @keydown.left.prevent="step(-1)"
          @keydown.home.prevent="step('first')"
          @keydown.end.prevent="step('last')"
          @dragenter="onTabDragEnter(tab.id)"
          @dragleave="cancelHover"
          @drop="cancelHover"
        >
          <span>{{ tab.name }}</span>
          <span
            v-if="viewEditor.editing"
            class="wtabs__count"
            :title="t('configurableViews.widget.tabs.count', { count: tab.widgets.length })"
          >{{ tab.widgets.length }}</span>
        </a>
      </li>
    </ul>

    <div
      v-if="active"
      class="wtabs__panel"
      role="tabpanel"
      :aria-label="active.name"
    >
      <WidgetGrid
        :key="active.id"
        :widgets="active.widgets"
        :editing="viewEditor.editing"
        :selected-id="viewEditor.selectedId"
        :gap="gap"
        :place="{ parentId: nodeId, tabId: active.id }"
      />
      <p
        v-if="!viewEditor.editing && !active.widgets.length"
        class="wtabs__empty"
      >
        {{ t('configurableViews.widget.tabs.empty') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// The shell's horizontal Tabbed, measure for measure: a bordered strip of 10/15-padded links, the
// active one in --active over a 2px rule, then a bordered panel.
.wtabs {
  display:        flex;
  flex-direction: column;
  height:         100%;
  min-width:      0;

  &__title {
    font-size:   18px;
    font-weight: 600;
    line-height: 22px;
    margin:      0 0 12px;
  }

  &__list {
    border:        1px solid var(--border);
    border-bottom: 0;
    display:       flex;
    flex-wrap:     wrap;
    list-style:    none;
    margin:        0;
    padding:       0;
  }

  &__tab {
    padding: 0 4px;

    a {
      align-items: center;
      color:       var(--link);
      cursor:      pointer;
      display:     flex;
      gap:         6px;
      padding:     10px 15px;

      &:hover {
        text-decoration: none;

        span:first-child {
          text-decoration: underline;
        }
      }

      &:focus-visible {
        outline:        2px solid var(--primary-keyboard-focus);
        outline-offset: -2px;
      }
    }

    &--active {
      border-bottom: 2px solid var(--active, var(--primary));

      a {
        color: var(--active, var(--primary));
      }
    }
  }

  &__count {
    background:    var(--default);
    border-radius: 10px;
    color:         var(--body-text);
    font-size:     11px;
    line-height:   1;
    padding:       3px 6px;
  }

  // The widget's own padding is the panel's, so the Spacing presets mean here what they mean on a card.
  &__panel {
    border:     1px solid var(--border);
    flex:       1 1 auto;
    min-height: 0;
    padding:    var(--wcard-solo-pad, 16px);
  }

  &__empty {
    color:     var(--muted);
    font-size: 14px;
    margin:    0;
  }
}
</style>
