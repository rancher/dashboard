<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { Panel } from '../templating/types';

// The bar under the app header — the Home's own navigation, and the only place a view is switched,
// renamed, created or published.
//
// It has two faces:
//
//   VIEW MODE  "Home", the views as tabs, then edit (✎) and the overflow menu (⋮).
//   EDIT MODE  the active view's name becomes editable in place, the other tabs go quiet because
//              you are editing THIS one, and the right-hand side turns into Cancel / Save as new
//              view / Save. The bar tints blue so it is obvious the page is in a different mode.
//
// It owns no state beyond the open menu: everything else is emitted to the Home page.

/** Everything the bar asks of the Home. Most asks carry nothing; switching and renaming say what to. */
type BarEmits = {
  select: [id: string];
  rename: [name: string];
  edit: [];
  cancel: [];
  save: [];
  'save-as-new': [];
  'rename-start': [];
  'new-view': [];
  duplicate: [];
  'set-default': [];
  publish: [];
  delete: [];
};

const props = withDefaults(defineProps<{
  views?: Panel[];
  activeId?: string | null;
  editing?: boolean;
  /** A brand-new view that has never been saved — Figma's "New view" state. */
  isNew?: boolean;
  /** The view this user opens the Home on. */
  defaultId?: string | null;
  dirty?: boolean;
  saving?: boolean;
  /** Where a new view was started from, shown beside "New view". */
  startedFrom?: string;
}>(), {
  views:       () => [],
  activeId:    '',
  editing:     false,
  isNew:       false,
  defaultId:   '',
  dirty:       false,
  saving:      false,
  startedFrom: '',
});

const emit = defineEmits<BarEmits>();

const menuOpen = ref(false);
const menuWrap = ref<HTMLElement | null>(null);

const activeView = computed(() => props.views.find((v) => v.id === props.activeId) || null);

// "Changes are saved to your account only." — unless this view IS the organization template, in
// which case saving it changes what everyone sees, and the bar must say so.
const editingHint = computed(() => {
  if (props.isNew) {
    return props.startedFrom ? `From ${ props.startedFrom }. Not saved yet.` : 'Not saved yet.';
  }

  return activeView.value?.org ? 'Changes are published to everyone.' : 'Changes are saved to your account only.';
});

const isDefault = computed(() => !!props.activeId && props.activeId === props.defaultId);

// A published panel is everyone's: the menu offers taking it back out rather than publishing it
// again, and the wording says "unpublish" so nobody reads it as deleting their own copy.
const isPublished = computed(() => !!activeView.value?.org);

function closeMenu(): void {
  menuOpen.value = false;
}

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value;
}

function onOutside(ev: MouseEvent): void {
  if (!menuWrap.value?.contains(ev.target as Node | null)) {
    closeMenu();
  }
}

function onKey(ev: KeyboardEvent): void {
  if (ev.key === 'Escape') {
    closeMenu();
  }
}

function stopWatchingForClose(): void {
  document.removeEventListener('mousedown', onOutside);
  window.removeEventListener('keydown', onKey);
}

/**
 * A menu closes on a CLICK outside it, or on Escape — not on the pointer leaving.
 *
 * Closing on mouseleave is how a hover menu behaves, and this is not one: you open it by clicking,
 * so it has to stay open until you decide otherwise. Sliding the pointer a few pixels wide of it on
 * the way to "Delete view" should not take the menu away from under you.
 *
 * The listeners exist only while the menu is open, so a closed bar costs nothing.
 */
watch(menuOpen, (open) => {
  if (open) {
    // Next tick: the click that OPENED the menu is still travelling, and would close it again.
    setTimeout(() => {
      document.addEventListener('mousedown', onOutside);
      window.addEventListener('keydown', onKey);
    }, 0);
  } else {
    stopWatchingForClose();
  }
});

onBeforeUnmount(stopWatchingForClose);

function onName(ev: Event): void {
  emit('rename', (ev.target as HTMLInputElement).value);
}
</script>

<template>
  <div
    class="vbar"
    :class="{ 'vbar--editing': editing }"
  >
    <h1 class="vbar__home">
      Home
    </h1>

    <!-- The views. While editing, the one being edited is renamed in place and the rest go quiet:
       you cannot switch away mid-edit without deciding what to do with your changes. -->
    <div class="vbar__views">
      <!-- One keyed slot per view, with the tab and the name box as branches INSIDE it. Keeping
         the key on a stable wrapper is what stops Vue reusing a <button> as the <input> (or the
         other way round) when the active view changes. -->
      <div
        v-for="view in views"
        :key="view.id"
        class="vbar__slot"
      >
        <input
          v-if="editing && view.id === activeId"
          class="vbar__name"
          :value="view.name"
          aria-label="Panel name"
          @input="onName"
        >
        <button
          v-else
          class="vbar__view"
          :class="{ 'vbar__view--active': !editing && view.id === activeId }"
          :disabled="editing"
          @click="$emit('select', view.id)"
        >
          {{ view.name }}
        </button>
      </div>
    </div>

    <template v-if="editing">
      <i class="icon icon-edit vbar__pencil" />
      <span class="vbar__mode">{{ isNew ? 'New panel' : 'Editing' }}</span>
      <span class="vbar__hint">{{ editingHint }}</span>

      <button
        class="btn role-secondary vbar__btn"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
      <button
        v-if="!isNew"
        class="btn role-secondary vbar__btn"
        :disabled="saving"
        @click="$emit('save-as-new')"
      >
        Save as new panel
      </button>
      <button
        class="btn role-primary vbar__btn"
        :disabled="saving || (!dirty && !isNew)"
        @click="$emit('save')"
      >
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </template>

    <template v-else>
      <button
        class="vbar__icon-btn"
        title="Edit this panel"
        aria-label="Edit this panel"
        @click="$emit('edit')"
      >
        <i class="icon icon-edit" />
      </button>

      <div
        ref="menuWrap"
        class="vbar__menu-wrap"
      >
        <button
          class="vbar__icon-btn"
          :class="{ 'vbar__icon-btn--on': menuOpen }"
          title="More"
          aria-label="More panel actions"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          @click="toggleMenu"
        >
          <i class="icon icon-actions" />
        </button>

        <ul
          v-if="menuOpen"
          class="vbar__menu"
        >
          <li>
            <button @click="closeMenu(); $emit('new-view')">
              New panel
            </button>
          </li>
          <li>
            <button @click="closeMenu(); $emit('duplicate')">
              Duplicate this panel
            </button>
          </li>
          <li>
            <button @click="closeMenu(); $emit('rename-start')">
              Rename
            </button>
          </li>
          <li>
            <button
              :disabled="isDefault"
              @click="closeMenu(); $emit('set-default')"
            >
              {{ isDefault ? 'This is my default' : 'Set as my default' }}
            </button>
          </li>
          <li class="vbar__menu-sep" />
          <li v-if="!isPublished">
            <button @click="closeMenu(); $emit('publish')">
              Publish as organization template
            </button>
          </li>
          <li
            v-if="!isPublished"
            class="vbar__menu-sep"
          />
          <li>
            <button
              :disabled="views.length < 2"
              @click="closeMenu(); $emit('delete')"
            >
              {{ isPublished ? 'Unpublish panel' : 'Delete panel' }}
            </button>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
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
  // --accent-btn is TRANSLUCENT, and this bar is sticky: laid on directly it let the page scroll
  // through it. Layering the tint over an opaque base keeps the token and makes the bar solid.
  &--editing {
    background: linear-gradient(var(--accent-btn), var(--accent-btn)), var(--body-bg);
  }

  &__home {
    flex:        0 0 auto;
    font-size:   18px;
    font-weight: 400;
    margin:      0 20px 0 0;
  }

  // The views are a SEGMENTED CONTROL: one track, the buttons sitting in it a pixel apart, the
  // active one filled. That is what makes them read as "pick one of these" rather than as links.
  //
  // One row, always. When the bar runs out of room the hint gives way first (below), then the
  // track scrolls — it never wraps onto a second line.
  &__views {
    align-items:     center;
    background:      var(--default);
    border-radius:   4px;
    display:         flex;
    flex:            0 1 auto;
    gap:             1px;
    min-width:       0;
    overflow-x:      auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  // A view tab: 30px tall, 12px of side padding, and the active one filled in the primary colour.
  &__view {
    background:    transparent;
    border:        none;
    border-radius: 4px;
    color:         var(--body-text);
    cursor:        pointer;
    flex:          0 0 auto;
    font-size:     14px;
    // The shell's global button rule sets a 40px min-height and line-height; a segmented control
    // is 30px, so both have to be said explicitly.
    height:        30px;
    line-height:   30px;
    min-height:    30px;
    padding:       0 12px;
    white-space:   nowrap;

    &:hover:not(:disabled):not(&--active) {
      background: var(--accent-btn);
    }

    &--active {
      background: var(--primary);
      color:      var(--primary-text);
    }

    &:disabled {
      color:  var(--muted);
      cursor: default;
    }
  }

  // The active view's name, edited where the tab was.
  &__slot {
    display: flex;
    flex:    0 0 auto;
  }

  // The name box replaces a tab inside the track, so it keeps the track's height and sits flush.
  &--editing &__views {
    padding: 0;
  }

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

  // ---- icon buttons + overflow menu ----
  // 38x32, and always in the accent style the design draws them in — they are the two ways into
  // editing, not incidental icons that only light up when you find them.
  &__icon-btn {
    align-items:     center;
    background:      var(--accent-btn);
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

    &:hover,
    &--on {
      background: var(--primary);
      color:      var(--primary-text);
    }

    i {
      font-size: 14px;
    }
  }

  &__menu-wrap {
    position: relative;
  }

  &__menu {
    background:    var(--body-bg);
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    box-shadow:    0 2px 10px rgba(0, 0, 0, 0.15);
    left:          0;
    list-style:    none;
    margin:        4px 0 0;
    min-width:     260px;
    padding:       8px 0;
    position:      absolute;
    top:           100%;
    z-index:       30;

    button {
      background:  transparent;
      border:      none;
      color:       var(--body-text);
      cursor:      pointer;
      display:     block;
      font-size:   14px;
      line-height: 20px;
      padding:     6px 16px;
      text-align:  left;
      width:       100%;

      &:hover:not(:disabled) {
        background: var(--accent-btn);
      }

      &:disabled {
        color:  var(--muted);
        cursor: default;
      }
    }
  }

  &__menu-sep {
    background: var(--border);
    height:     1px;
    margin:     8px 0;
  }
}

// The shell's app header is a stacking context at z-index 14, and the user menu, the notification
// tray and every other header dropdown live INSIDE it. So anything on the page at 14 or above does
// not merely sit beside them — it covers the whole header, menus and all. Page chrome stays below
// that ceiling; it only ever needs to beat the page, never the app.
</style>
