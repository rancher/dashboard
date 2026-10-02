<script setup lang="ts">
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { isMac, shortcutLabel } from '@shell/utils/platform';
import { RcDropdown, RcDropdownItem, RcDropdownSeparator, RcDropdownTrigger } from '@components/RcDropdown';
import { useDragReorder } from '../composables/useDragReorder';
import { isStockView } from '../templating/view-model';
import type { View } from '../templating/types';

// The bar under the app header — a configurable page's own navigation, and the only place a view
// is switched, renamed, created or published. Its tabs behave like a table's saved view tabs: the
// view the page opens on leads, the rest can be dragged into any order, and the menu is the same.
//
// It has two faces:
//
//   VIEW MODE  "Home", the views as tabs, then edit (✎) and the view menu (⋮).
//   EDIT MODE  the active view's name becomes editable in place, the other tabs go quiet because
//              you are editing THIS one, and the right-hand side turns into Cancel / Save as new
//              view / Save. The bar tints blue so it is obvious the page is in a different mode.
//
// It owns no views: every change is emitted to the page, which stores it.

/** How close to an end of the strip a held tab has to be before the strip scrolls that way */
const TAB_SCROLL_EDGE = 56;

const TAB_SCROLL_STEP = 12;

const TAB_SCROLL_SETTLE_MAX_MS = 1200;

const TAB_FLASH_MS = 600;


/** Everything the bar asks of the page. The per-tab actions say which view they are for. */
type BarEmits = {
  select: [id: string];
  /** The name typed while editing the active view. */
  rename: [name: string];
  'rename-view': [id: string, name: string];
  /** Edit this view: it is opened first if it is not the one on screen. */
  edit: [id: string];
  cancel: [];
  save: [];
  'save-as-new': [];
  'toggle-drawer': [];
  'new-view': [];
  duplicate: [id: string];
  'set-default': [id: string];
  publish: [id: string];
  unpublish: [id: string];
  delete: [id: string];
  reorder: [ids: string[]];
};

const props = withDefaults(defineProps<{
  /** In the bar's order - see orderViews. */
  views?: View[];
  activeId?: string | null;
  editing?: boolean;
  /** A brand-new view that has never been saved — Figma's "New view" state. */
  isNew?: boolean;
  /** The view this user opens the page on. None means Rancher's own page. */
  defaultId?: string | null;
  /** The views that are published, or are this user's copy of a published view. */
  publishedIds?: string[];
  dirty?: boolean;
  saving?: boolean;
  /** Where a new view was started from, shown beside "New view". */
  startedFrom?: string;
  /** Whether the editor's drawer is open, while editing. */
  drawerOpen?: boolean;
}>(), {
  views:        () => [],
  activeId:     '',
  editing:      false,
  isNew:        false,
  defaultId:    '',
  publishedIds: () => [],
  dirty:        false,
  saving:       false,
  startedFrom:  '',
  drawerOpen:   true,
});

const emit = defineEmits<BarEmits>();

const store = useStore();
const { t } = useI18n(store);

const root = ref<HTMLElement | null>(null);

const tabStrip = ref<HTMLElement | null>(null);

// The editable name while editing - inside the tab loop, so a list; at most one is rendered.
const nameInput = ref<HTMLInputElement[]>([]);

/** Function refs, as there is a set per tab */
const tabWraps = new Map<string, HTMLElement>();

const tabButtons = new Map<string, HTMLElement>();

const renameInputs = new Map<string, HTMLInputElement>();

const keepRef = <T, >(map: Map<string, T>, key: string, el: T | null) => {
  if (el) {
    map.set(key, el);
  } else {
    map.delete(key);
  }
};

const renamingId = ref<string | null>(null);

const renameDraft = ref('');

const tabBounds = ref<number[] | null>(null);

const flashTabId = ref<string | null>(null);

/** Set by the menu, so the tab is flashed once the page has moved it to the front */
const flashOnDefault = ref(false);

let flashTimer: ReturnType<typeof setTimeout> | undefined;

let flashFrame = 0;

let tabScrollFrame = 0;

const shortcuts = computed(() => ({ duplicate: shortcutLabel([isMac ? '⌘' : 'Ctrl', 'D']) }));

const activeView = computed(() => props.views.find((v) => v.id === props.activeId) || null);

// "Changes are saved to your account only." — unless this view IS the organization template, in
// which case saving it changes what everyone sees, and the bar must say so.
const editingHint = computed(() => {
  if (props.isNew) {
    return props.startedFrom ? t('configurableViews.bar.notSavedFrom', { source: props.startedFrom }) : t('configurableViews.bar.notSaved');
  }

  return activeView.value?.org ? t('configurableViews.bar.publishedHint') : t('configurableViews.bar.personalHint');
});

// Rancher's own page is not the user's to change: it cannot be edited, renamed, published,
// unpublished or deleted - only copied, and made the page's default.
const isStock = (view: View) => isStockView(view);

/** No default set means Rancher's own page is the one the page opens on */
const isDefaultTab = (view: View) => (props.defaultId ? props.defaultId === view.id : isStock(view));

/** The tab the page opens on can't be dragged out of the front, nor anything dropped before it */
const LOCKED_TAB_COUNT = 1;

const isPublished = (view: View) => props.publishedIds.includes(view.id);

const publishedTooltip = (view: View) => (view.org ? t('configurableViews.bar.shared') : t('configurableViews.bar.sharedCopy'));

const tabs = computed<View[]>(() => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (!tabDragOrder.value) {
    return props.views;
  }

  const byId = new Map(props.views.map((view) => [view.id, view]));

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return tabDragOrder.value.map((id) => byId.get(id)).filter((view): view is View => !!view);
});

/** The one tab Tab can land on (roving tabindex); the first if the current view isn't among them */
const focusableTabId = computed(() => (tabs.value.find((view) => view.id === props.activeId) || tabs.value[0])?.id);

/** Compared by bar, so the shortcut belongs to the bar the focus is in */
const ownsTarget = (target: EventTarget | null) => !!root.value && target instanceof Node && root.value.contains(target);

const tabWrap = (view: View) => tabWraps.get(view.id);

const tabButton = (view: View) => tabButtons.get(view.id);

/**
 * Measured once as the drag begins, relative to the list: measuring the live order swaps tabs back
 * and forth
 */
const captureTabSlots = () => {
  const list = tabStrip.value?.querySelector('.vbar__list');

  if (!list) {
    return;
  }

  const base = list.getBoundingClientRect().left;
  const boxes = props.views.map((view) => {
    const rect = tabWrap(view)?.getBoundingClientRect();

    return rect ? { left: rect.left - base, right: rect.right - base } : null;
  }).filter(Boolean) as { left: number, right: number }[];

  // The middle of the gap between two tabs
  tabBounds.value = boxes.slice(0, -1).map((box, i) => (box.right + boxes[i + 1].left) / 2);
};

const tabIndexAt = (clientX: number) => {
  const list = tabStrip.value?.querySelector('.vbar__list');

  if (!list) {
    return 0;
  }

  const x = clientX - list.getBoundingClientRect().left;
  const bounds = tabBounds.value || [];
  let i = 0;

  while (i < bounds.length && x >= bounds[i]) {
    i++;
  }

  return i;
};

/** A frame loop, so holding still at the edge keeps it scrolling */
const runTabScroll = () => {
  const step = () => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (!tabDragMoved.value) {
      return;
    }

    const strip = tabStrip.value;

    if (strip) {
      const rect = strip.getBoundingClientRect();

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      if (tabDragPointer.value < rect.left + TAB_SCROLL_EDGE) {
        strip.scrollLeft -= TAB_SCROLL_STEP;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        placeDraggedTab();
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      } else if (tabDragPointer.value > rect.right - TAB_SCROLL_EDGE) {
        strip.scrollLeft += TAB_SCROLL_STEP;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        placeDraggedTab();
      }
    }

    tabScrollFrame = requestAnimationFrame(step);
  };

  cancelAnimationFrame(tabScrollFrame);
  tabScrollFrame = requestAnimationFrame(step);
};

const {
  heldId: heldTabKey, order: tabDragOrder, moved: tabDragMoved, pointer: tabDragPointer, start: armTabDrag, place: placeDraggedTab
} = useDragReorder({
  axis:         'x',
  initialOrder: () => props.views.map((view) => view.id),
  measure:      captureTabSlots,
  indexAt:      tabIndexAt,
  firstMovable: () => LOCKED_TAB_COUNT,
  onBegin:      () => {
    // Otherwise the pointer selects the tab names it crosses
    window.getSelection()?.removeAllRanges();
    runTabScroll();
  },
  onEnd: () => {
    cancelAnimationFrame(tabScrollFrame);
    tabBounds.value = null;
  },
  onCommit: (order) => emit('reorder', order),
});

const startTabDrag = (view: View, event: MouseEvent) => {
  if (event.button !== 0 || props.editing || renamingId.value || props.views.findIndex((v) => v.id === view.id) < LOCKED_TAB_COUNT) {
    return;
  }

  armTabDrag(view.id, event);
};

/**
 * Focus a view's tab and bring it into sight. `toEnd` runs the strip to its end, where a new tab is
 * before the strip has laid it out
 */
const focusTab = (id: string, toEnd = false) => {
  nextTick(() => {
    const view = tabs.value.find((candidate) => candidate.id === id);
    const btn = view && tabButton(view);

    if (!btn) {
      return;
    }

    // Focus would scroll the strip itself, fighting the run to the end
    btn.focus({ preventScroll: !!toEnd });

    if (!toEnd) {
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });

      return;
    }

    requestAnimationFrame(() => {
      const strip = tabStrip.value;

      if (strip) {
        strip.scrollLeft = strip.scrollWidth;
      }
    });
  });
};

/** Renamed in place on its tab, as a table's saved view is */
const openRename = (id: string) => {
  const view = props.views.find((candidate) => candidate.id === id);

  if (!view || isStock(view)) {
    return;
  }

  renamingId.value = view.id;
  renameDraft.value = view.name;

  nextTick(() => {
    const input = renameInputs.get(view.id);

    input?.focus();
    input?.select();
  });
};

const commitRename = () => {
  const id = renamingId.value;
  const name = (renameDraft.value || '').trim();
  const view = props.views.find((v) => v.id === id);

  renamingId.value = null;
  renameDraft.value = '';

  if (!name || !view || name === view.name) {
    return;
  }

  emit('rename-view', view.id, name);
};

const cancelRename = () => {
  renamingId.value = null;
  renameDraft.value = '';
};

/** Focus follows: with a roving tabindex, the tab left behind is no longer reachable */
const goToTab = (view: View) => {
  emit('select', view.id);
  focusTab(view.id);
};

/** Moving focus picks the view too, as the product's other tabs do */
const stepTab = (delta: number) => {
  const list = tabs.value;

  if (list.length < 2) {
    return;
  }

  const focused = list.findIndex((view) => tabButton(view) === document.activeElement);
  const at = focused >= 0 ? focused : list.findIndex((view) => view.id === focusableTabId.value);
  const next = list[((at < 0 ? 0 : at) + delta + list.length) % list.length];

  goToTab(next);
};

const edgeTab = (which: string) => {
  const list = tabs.value;
  const next = which === 'first' ? list[0] : list[list.length - 1];

  if (next) {
    goToTab(next);
  }
};

/** Waits for the scroll to finish rather than a fixed delay; the cap covers one that never does */
const flashTabWhenScrolled = (strip: HTMLElement, id: string) => {
  clearTimeout(flashTimer);
  cancelAnimationFrame(flashFrame);

  const deadline = Date.now() + TAB_SCROLL_SETTLE_MAX_MS;

  const settle = () => {
    if (strip.scrollLeft > 1 && Date.now() < deadline) {
      flashFrame = requestAnimationFrame(settle);

      return;
    }

    flashTabId.value = id;
    flashTimer = setTimeout(() => {
      flashTabId.value = null;
    }, TAB_FLASH_MS);
  };

  settle();
};

/** Picking Rancher's own page is how to go back to no default */
const setDefaultView = (view: View) => {
  flashOnDefault.value = true;
  emit('set-default', view.id);
};

// The tab just moved to the front, so scroll there and flash it to say why the strip moved. Once the
// page has stored it, not on the click: until then the tab is still where it was
watch(() => props.views[0]?.id, (id) => {
  if (!flashOnDefault.value || !id) {
    return;
  }

  flashOnDefault.value = false;

  nextTick(() => {
    const strip = tabStrip.value;

    if (!strip) {
      return;
    }

    strip.scrollTo({ left: 0, behavior: 'smooth' });
    flashTabWhenScrolled(strip, id);
  });
});

const duplicateCurrent = () => {
  if (props.activeId) {
    emit('duplicate', props.activeId);
  }
};

const onShortcut = (event: KeyboardEvent) => {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || props.editing) {
    return;
  }

  // Only for the bar the focus is in
  if (!ownsTarget(event.target) || event.key.toLowerCase() !== 'd') {
    return;
  }

  event.preventDefault();
  duplicateCurrent();
};

function onName(ev: Event): void {
  emit('rename', (ev.target as HTMLInputElement).value);
}

onMounted(() => {
  window.addEventListener('keydown', onShortcut);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onShortcut);
  clearTimeout(flashTimer);
  cancelAnimationFrame(flashFrame);
  cancelAnimationFrame(tabScrollFrame);
});

defineExpose({ openRename, focusTab });
</script>


<template>
  <div
    ref="root"
    class="vbar"
    :class="{ 'vbar--editing': editing }"
  >
    <!-- The views. While editing, the one being edited is renamed in place and the rest go quiet:
       you cannot switch away mid-edit without deciding what to do with your changes. -->
    <div
      ref="tabStrip"
      class="vbar__views"
    >
      <TransitionGroup
        tag="div"
        name="vbar-slot"
        class="vbar__list"
        :class="{ 'is-reordering': heldTabKey !== null }"
        role="tablist"
        :aria-label="t('configurableViews.bar.tabsLabel')"
      >
        <!-- One keyed slot per view, with the tab and the name boxes as branches INSIDE it. Keeping
           the key on a stable wrapper is what stops Vue reusing a <button> as the <input> (or the
           other way round) when the active view changes. -->
        <div
          v-for="view in tabs"
          :key="view.id"
          :ref="(el) => keepRef(tabWraps, view.id, el as HTMLElement | null)"
          class="vbar__slot"
          :class="{
            held: heldTabKey === view.id,
            flash: flashTabId === view.id,
            'vbar__slot--active': !editing && view.id === activeId,
            'vbar__slot--field': (editing && view.id === activeId) || renamingId === view.id,
          }"
          :data-testid="`configurable-views-tab-${ view.id }`"
          @mousedown="startTabDrag(view, $event)"
        >
          <input
            v-if="editing && view.id === activeId"
            ref="nameInput"
            class="vbar__name"
            :value="view.name"
            :aria-label="t('configurableViews.bar.viewName')"
            @input="onName"
          >
          <input
            v-else-if="renamingId === view.id"
            :ref="(el) => keepRef(renameInputs, view.id, el as HTMLInputElement | null)"
            v-model="renameDraft"
            type="text"
            class="vbar__name"
            :aria-label="t('configurableViews.bar.viewName')"
            data-testid="configurable-views-rename-input"
            @keydown.enter.prevent="commitRename"
            @keydown.esc.prevent="cancelRename"
            @blur="commitRename"
            @click.stop
          >
          <!-- The tab and its chevron are what the menu is placed against, so it opens under the tab,
             lined up with its start, as the table views' menus do -->
          <rc-dropdown
            v-else
            placement="bottom-start"
            :distance="4"
            :aria-label="t('configurableViews.bar.moreActions')"
          >
            <button
              :ref="(el) => keepRef(tabButtons, view.id, el as HTMLElement | null)"
              type="button"
              role="tab"
              class="vbar__view"
              :aria-selected="view.id === activeId"
              :tabindex="view.id === focusableTabId ? 0 : -1"
              :disabled="editing"
              @click="$emit('select', view.id)"
              @keydown.left.prevent="stepTab(-1)"
              @keydown.right.prevent="stepTab(1)"
              @keydown.home.prevent="edgeTab('first')"
              @keydown.end.prevent="edgeTab('last')"
            >
              {{ view.name }}
              <i
                v-if="isPublished(view)"
                v-clean-tooltip="publishedTooltip(view)"
                class="icon icon-groups vbar__shared"
                :aria-label="publishedTooltip(view)"
                data-testid="configurable-views-tab-shared"
              />
            </button>

            <rc-dropdown-trigger
              v-if="!editing"
              variant="ghost"
              size="small"
              class="vbar__caret"
              :aria-label="t('configurableViews.bar.menuFor', { name: view.name })"
              :data-testid="`configurable-views-tab-menu-${ view.id }`"
            >
              <i class="icon icon-chevron-down" />
            </rc-dropdown-trigger>

            <template #dropdownCollection>
              <div class="menu-panel">
                <rc-dropdown-item
                  v-if="!isStock(view)"
                  :data-testid="`configurable-views-edit-${ view.id }`"
                  @click="$emit('edit', view.id)"
                >
                  <template #before>
                    <i class="icon icon-edit" />
                  </template>
                  {{ t('configurableViews.bar.edit') }}
                </rc-dropdown-item>
                <rc-dropdown-item
                  v-if="!isStock(view)"
                  :data-testid="`configurable-views-rename-${ view.id }`"
                  @click="openRename(view.id)"
                >
                  <template #before>
                    <i class="menu-gutter" />
                  </template>
                  {{ t('configurableViews.bar.rename') }}
                </rc-dropdown-item>
                <rc-dropdown-item
                  :data-testid="`configurable-views-duplicate-${ view.id }`"
                  @click="$emit('duplicate', view.id)"
                >
                  <template #before>
                    <i class="icon icon-copy" />
                  </template>
                  {{ t('configurableViews.bar.duplicate') }}
                  <span class="menu-shortcut">{{ shortcuts.duplicate }}</span>
                </rc-dropdown-item>
                <rc-dropdown-item
                  :class="{ selected: isDefaultTab(view) }"
                  :data-testid="`configurable-views-set-default-${ view.id }`"
                  @click="setDefaultView(view)"
                >
                  <template #before>
                    <i class="menu-gutter" />
                  </template>
                  {{ t('configurableViews.bar.setDefault') }}
                  <i
                    v-if="isDefaultTab(view)"
                    class="icon icon-checkmark menu-check"
                  />
                </rc-dropdown-item>

                <template v-if="!isStock(view)">
                  <rc-dropdown-separator />
                  <rc-dropdown-item
                    v-if="!view.org"
                    :data-testid="`configurable-views-publish-${ view.id }`"
                    @click="$emit('publish', view.id)"
                  >
                    <template #before>
                      <i class="icon icon-groups" />
                    </template>
                    {{ t('configurableViews.bar.publish') }}
                  </rc-dropdown-item>
                  <rc-dropdown-item
                    v-if="isPublished(view)"
                    :data-testid="`configurable-views-unpublish-${ view.id }`"
                    @click="$emit('unpublish', view.id)"
                  >
                    <template #before>
                      <i class="menu-gutter" />
                    </template>
                    {{ t('configurableViews.bar.unpublish') }}
                  </rc-dropdown-item>
                </template>

                <!-- A published view is everyone's: it is unpublished, not deleted -->
                <template v-if="!isStock(view) && !view.org">
                  <rc-dropdown-separator />
                  <rc-dropdown-item
                    :data-testid="`configurable-views-delete-${ view.id }`"
                    @click="$emit('delete', view.id)"
                  >
                    <template #before>
                      <i class="icon icon-trash" />
                    </template>
                    {{ t('configurableViews.bar.delete') }}
                  </rc-dropdown-item>
                </template>
              </div>
            </template>
          </rc-dropdown>
        </div>
      </TransitionGroup>

      <!-- Sticky at the end of the strip: the scroll shadow over the tabs passing under it, gone at the end -->
      <span
        class="vbar__shadow"
        aria-hidden="true"
      />
    </div>

    <button
      v-if="!editing"
      type="button"
      class="btn btn-sm role-link vbar__new"
      data-testid="configurable-views-new"
      @click="$emit('new-view')"
    >
      <i class="icon icon-plus" />
      {{ t('configurableViews.bar.addView') }}
    </button>

    <template v-if="editing">
      <i class="icon icon-edit vbar__pencil" />
      <span class="vbar__mode">{{ isNew ? t('configurableViews.bar.newView') : t('configurableViews.bar.editing') }}</span>
      <span class="vbar__hint">{{ editingHint }}</span>

      <button
        class="btn role-secondary vbar__btn"
        @click="$emit('cancel')"
      >
        {{ t('generic.cancel') }}
      </button>
      <button
        v-if="!isNew"
        class="btn role-secondary vbar__btn"
        :disabled="saving"
        @click="$emit('save-as-new')"
      >
        {{ t('configurableViews.bar.saveAsNew') }}
      </button>
      <button
        class="btn role-primary vbar__btn"
        :disabled="saving || (!dirty && !isNew)"
        @click="$emit('save')"
      >
        {{ saving ? t('configurableViews.bar.saving') : t('configurableViews.bar.save') }}
      </button>

      <!-- Last, over the drawer it opens and closes: brings back the drawer its ✕ closed, or closes
         it here too, for the whole width -->
      <button
        class="vbar__icon-btn"
        :class="{ 'vbar__icon-btn--on': drawerOpen }"
        :title="drawerOpen ? t('configurableViews.bar.hideEditor') : t('configurableViews.bar.showEditor')"
        :aria-label="drawerOpen ? t('configurableViews.bar.hideEditor') : t('configurableViews.bar.showEditor')"
        :aria-pressed="drawerOpen ? 'true' : 'false'"
        data-testid="configurable-views-toggle-drawer"
        @click="$emit('toggle-drawer')"
      >
        <i class="icon icon-dock" />
      </button>
    </template>
  </div>
</template>

<style lang="scss" scoped>
// The same curves the side nav's pinned shelf uses
$drag-displace-curve: cubic-bezier(0.2, 0, 0, 1);

// A view's button in the bar, and its chevron beside it
$tab-height: 30px;

// Same as `cluster-scroll-shadow` in TopLevelMenu: shown along the scroll, gone at the end
@keyframes vbar-scroll-shadow {
  0%, 88% { opacity: 1; }
  100%    { opacity: 0; }
}

// Drawn the way the app bar marks a cluster arriving on the pinned shelf
@keyframes vbar-slot-arrive {
  0%   { opacity: 0; transform: translateX(-6px) scale(0.985); }
  100% { opacity: 1; transform: none; }
}

@keyframes vbar-slot-wash {
  0%   { box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 35%, transparent); }
  100% { box-shadow: 0 0 0 3px transparent; }
}

// 57px tall, 20px side padding, a hairline under it — and a blue wash while editing.
.vbar {
  align-items:   center;
  background:    var(--header-bg, var(--body-bg));
  border-bottom: 1px solid var(--border);
  box-sizing:    border-box;
  display:       flex;
  gap:           12px;
  min-height:    57px;
  padding:       0 20px;
  position:      sticky;
  top:           0;
  // Below the app header's stacking context (see the note on z-index at the foot of this file).
  z-index:       8;

  // A wash of the primary colour while editing — the same tint the drop zone and the selected
  // widget use, so the whole edit mode reads as one state.
  //
  // Mixed from --primary itself: --accent-btn is the stock blue in themes that recolour only
  // --primary (SUSE's green), so it didn't follow the brand. Mixed into the page colour rather than
  // transparent, as the bar is sticky and the page would scroll through it.
  &--editing {
    background: color-mix(in srgb, var(--primary) 12%, var(--body-bg));
  }

  // The views are a BUTTON GROUP, coloured as the shell's (see ButtonGroup): buttons side by side,
  // joined, the active one filled. One row, always: when the bar runs out of room the hint gives way
  // first (below), then the group scrolls - it never wraps onto a second line.
  &__views {
    align-items:     center;
    display:         flex;
    flex:            0 1 auto;
    min-width:       0;
    overflow-x:      auto;
    overflow-y:      hidden;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  // Nothing between a tab's menu and the strip is positioned: the menu mounts inside the strip, and
  // a positioned box between the two would clip it to the strip and scroll the strip to reach it.
  &__list {
    align-items: center;
    display:     flex;
    flex:        0 0 auto;
  }

  // ONE BUTTON per view: the slot. Its name and its chevron are parts of it, with no look of their
  // own, so the whole button lights up wherever it is hovered. No type size of its own either: the two
  // parts are inline, and the space the markup leaves between them would open a gap. Each sets its own.
  &__slot {
    background:  var(--toggle-off-bg, var(--disabled-bg));
    color:       var(--toggle-off-color, var(--body-text));
    display:     flex;
    flex:        0 0 auto;
    font-size:   0;
    white-space: nowrap;

    &:hover {
      background: var(--toggle-off-hover, var(--disabled-bg));
      color:      var(--toggle-off-color, var(--disabled-hover-text));
    }

    &--active,
    &--active:hover {
      background: var(--toggle-on-bg, var(--primary));
      color:      var(--toggle-on-color, var(--primary-hover-text));
    }

    &--active:hover {
      background: var(--active-hover);
    }

    // Holding the name box: the box is the button now
    &--field,
    &--field:hover {
      background: transparent;
    }

    // The group's outer corners only
    &:first-child {
      border-bottom-left-radius: var(--border-radius);
      border-top-left-radius:    var(--border-radius);
    }

    &:last-child {
      border-bottom-right-radius: var(--border-radius);
      border-top-right-radius:    var(--border-radius);
    }
  }

  // The parts of a view's button: its name, then its chevron, on one line inside the box its menu is
  // placed against.
  &__view,
  &__list &__caret {
    background:     transparent;
    border:         0;
    border-radius:  0;
    color:          inherit;
    cursor:         pointer;
    height:         $tab-height;
    min-height:     $tab-height;
    vertical-align: top;

    &:focus-visible {
      outline:        2px solid var(--primary-keyboard-focus);
      outline-offset: -2px;
    }
  }

  &__view {
    align-items:   center;
    display:       inline-flex;
    font-size:     14px;
    gap:           6px;
    line-height:   $tab-height;
    padding:       0 12px;

    // Its chevron finishes the button
    &:not(:last-child) {
      padding-right: 4px;
    }

    &:disabled {
      color:  var(--muted);
      cursor: default;
    }
  }

  // Three classes deep, to win over the dropdown trigger's own button look in every state - at rest
  // as well as hovered or focused, so its size never changes under the pointer.
  &__list &__slot &__caret {
    background: transparent;
    color:      inherit;
    min-width:  0;
    padding:    0 10px 0 2px;

    &:hover,
    &:focus {
      background: transparent;
      color:      inherit;
    }

    i {
      font-size: 12px;
    }
  }

  // The same scroll shadow as the table views' tab strip: shown while there is more to the right,
  // gone once the strip reaches its end.
  &__shadow {
    align-self:     stretch;
    background:     linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--body-text) 18%, transparent) 100%);
    flex:           0 0 12px;
    margin-left:    -12px;
    opacity:        0;
    pointer-events: none;
    position:       sticky;
    right:          0;
    z-index:        2;
    animation:          vbar-scroll-shadow linear both;
    animation-timeline: scroll(nearest inline);

    @supports not (animation-timeline: scroll()) {
      opacity: 1;
    }
  }

  &__shared {
    font-size: 14px;
  }

  // The active view's name, edited where the tab was.
  &__name {
    background:    var(--body-bg);
    border:        1px solid var(--primary);
    border-radius: var(--border-radius);
    box-sizing:    border-box;
    color:         var(--body-text);
    font-size:     14px;
    height:        30px;
    min-height:    30px;
    padding:       0 10px;
    width:         180px;
  }

  &__pencil {
    color:     var(--body-text);
    flex:      0 0 auto;
    font-size: 16px;
  }

  &__mode {
    flex:        0 0 auto;
    font-size:   14px;
    font-weight: 700;
    white-space: nowrap;
  }

  // The hint gives way first when the bar gets tight — the buttons never do. It also takes the
  // slack, which is what pushes Cancel / Save to the right edge.
  &__hint {
    color:         var(--muted);
    flex:          1 1 0;
    font-size:     14px;
    min-width:     0;
    overflow:      hidden;
    text-overflow: ellipsis;
    white-space:   nowrap;
  }

  // 32px, said three ways: the shell's global .btn rule is 40 tall with a 40px line-height.
  &__btn {
    flex:        0 0 auto;
    height:      32px;
    line-height: 1;
    min-height:  32px;
    min-width:   0;
    white-space: nowrap;
  }

  // ---- icon buttons ----
  // 38x32, in the accent style the design draws them in: the drawer's toggle while editing.
  &__icon-btn {
    align-items:     center;
    background:      color-mix(in srgb, var(--primary) 12%, transparent);
    border:          1px solid var(--primary);
    border-radius:   4px;
    color:           var(--primary);
    cursor:          pointer;
    display:         flex;
    flex:            0 0 auto;
    height:          32px;
    justify-content: center;
    line-height:     1;
    min-height:      32px;
    padding:         0;
    width:           38px;

    &:hover:not(:disabled),
    &--on,
    &[aria-expanded="true"] {
      background: var(--primary);
      color:      var(--primary-text);
    }

    i {
      font-size: 14px;
    }
  }

  &__new {
    flex:   0 0 auto;
    gap:    6px;
    margin: 0 0 0 8px;
  }
}

// ---- reordering, as a table's saved view tabs are reordered ----

// Only while carrying: FLIP also fires on renames
.vbar__list.is-reordering {
  cursor: grabbing;

  .vbar-slot-move {
    transition: transform 0.2s $drag-displace-curve;
  }

  .vbar__view,
  .vbar__slot {
    cursor: grabbing;
  }

  // Lifted like the app bar's pinned shelf rows, with the same shadow
  .vbar__slot.held {
    position: relative;
    z-index: 1;
    transform: scale(1.02);
    transition: transform 0.2s $drag-displace-curve;
    border-radius: var(--border-radius);
    background: color-mix(in srgb, var(--primary) 14%, var(--body-bg));
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
  }
}

// The tab that just became the default, arriving at the front
.vbar__slot.flash {
  border-radius: var(--border-radius);
  animation: vbar-slot-arrive 0.16s ease-out, vbar-slot-wash 0.6s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .vbar__slot.flash {
    animation: none;
  }
}

.vbar__slot {
  user-select: none;
}

.menu-panel {
  display: flex;
  flex-direction: column;
  min-width: 240px;
  text-align: left;

  // Not named `icon-*`: the icon font claims `[class*=" icon-"]` with !important
  .menu-gutter {
    display: inline-block;
    flex: none;
    width: 14px;
  }

  .menu-shortcut,
  .menu-check {
    margin-left: auto;
    padding-left: 24px;
  }

  .menu-shortcut {
    color: var(--dropdown-secondary-text);
    font-size: 12px;
    white-space: nowrap;
  }

  // `--active` follows the brand in both themes; `--info` doesn't
  [dropdown-menu-item].selected {
    color: var(--active, var(--primary));
  }
}

// The shell's app header is a stacking context at z-index 14, and the user menu, the notification
// tray and every other header dropdown live INSIDE it. So anything on the page at 14 or above does
// not merely sit beside them — it covers the whole header, menus and all. Page chrome stays below
// that ceiling; it only ever needs to beat the page, never the app.
</style>
