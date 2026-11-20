<script setup lang="ts">
/**
 * The signed in user's user types, most important first, which they can reorder (by dragging a row's grip, or Alt+Up / Down on a row), turn
 * off and on (a row is a checkbox, as the table views' columns), or put back to the default. Each change is saved straight away, as other
 * preferences are
 */
import {
  computed, nextTick, onMounted, ref, shallowRef
} from 'vue';
import { useStore } from 'vuex';
import { useShell } from '@shell/apis';
import type { UserTypePreferences, UserTypeResource } from '@shell/apis/intf/shell';
import { RcButton } from '@components/RcButton';
import { RcIcon } from '@components/RcIcon';
import DragGrip from '@shell/components/DragGrip.vue';
import { useDragReorder, useListSlots } from '@shell/composables/useDragReorder';
import { useI18n } from '@shell/composables/useI18n';
import { isMac } from '@shell/utils/platform';
import { moveInOrder } from '@shell/utils/table-views/views';

const { t } = useI18n(useStore());
const userTypesApi = useShell().userTypes;

/** Null until loaded. Disabled ones included. Shallow: each load replaces the list */
const userTypes = shallowRef<UserTypeResource[] | null>(null);
const preferences = ref<UserTypePreferences>({});
const list = ref<HTMLElement | null>(null);

const hasOwnPreferences = computed(() => !!Object.keys(preferences.value).length);

const isEnabled = (userType: UserTypeResource) => !preferences.value[userType.metadata.name]?.disabled;

/** Said by a screen reader: where a moved user type went, which the focus, left on the row, doesn't show */
const announcement = ref('');

/** Cleared first, so saying the same thing twice is heard twice */
const announce = async(message: string) => {
  announcement.value = '';
  await nextTick();
  announcement.value = message;
};

const moveKeysHint = computed(() => t('prefs.userTypes.moveKeys', { modifier: isMac ? 'Option' : 'Alt' }));

const names = computed(() => (userTypes.value || []).map((userType) => userType.metadata.name));

const slots = useListSlots(list, '[data-user-type]');

const showUserTypes = async() => {
  userTypes.value = await userTypesApi.currentUserTypes({ includeDisabled: true });
  preferences.value = userTypesApi.currentUserTypePreferences();
};

const toggle = async(userType: UserTypeResource) => {
  await userTypesApi.setCurrentUserTypeEnabled(userType.metadata.name, !isEnabled(userType));
  await showUserTypes();
};

const save = async(order: string[]) => {
  await userTypesApi.reorderCurrentUserTypes(order);
  await showUserTypes();
};

const { heldId, order: dragOrder, start: armDrag } = useDragReorder({
  axis:         'y',
  initialOrder: () => names.value,
  measure:      slots.measure,
  indexAt:      slots.indexAt,
  onEnd:        slots.clear,
  onCommit:     save,
});

/** Mid-drag the rows follow the pointer, not the saved order */
const shownUserTypes = computed(() => {
  const all = userTypes.value || [];

  if (!dragOrder.value) {
    return all;
  }

  return dragOrder.value.map((name) => all.find((userType) => userType.metadata.name === name)).filter((userType): userType is UserTypeResource => !!userType);
});

/** Empty content hides the tooltip once a row is picked up */
const reorderTip = computed(() => ({ content: heldId.value ? '' : t('prefs.userTypes.reorder'), placement: 'left' }));

const startDrag = (name: string, event: MouseEvent) => {
  if (event.button !== 0) {
    return;
  }

  // Otherwise the pointer selects the names it crosses
  event.preventDefault();
  armDrag(name, event);
};

/** The keyboard's way to reorder: one place up or down */
const move = async(userType: UserTypeResource, step: number) => {
  const from = names.value.indexOf(userType.metadata.name);
  const to = from + step;

  if (to < 0 || to >= names.value.length) {
    return;
  }

  await save(moveInOrder(names.value, from, to));
  announce(t('prefs.userTypes.moved', {
    label: userType.spec.displayName, position: to + 1, total: names.value.length
  }));

  // Moving the row takes it out of the page for a moment, which drops its focus
  await nextTick();
  list.value?.querySelector<HTMLElement>(`[data-user-type="${ userType.metadata.name }"]`)?.focus();
};

/** Back to the user types' own order, all enabled */
const reset = async() => {
  await userTypesApi.setCurrentUserTypePreferences({});
  await showUserTypes();
  announce(t('prefs.userTypes.resetDone'));
};

/**
 * Preferences for user types that were deleted, or that the user no longer has, are dropped before the list is shown
 */
onMounted(async() => {
  const mine = await userTypesApi.currentUserTypes({ includeDisabled: true });
  const mineNames = mine.map((userType) => userType.metadata.name);
  const saved = userTypesApi.currentUserTypePreferences();
  const kept = Object.fromEntries(Object.entries(saved).filter(([name]) => mineNames.includes(name)));

  if (Object.keys(kept).length !== Object.keys(saved).length) {
    await userTypesApi.setCurrentUserTypePreferences(kept);
  }

  await showUserTypes();
});
</script>

<template>
  <div data-testid="prefs__user-types">
    <div
      class="sr-only"
      role="status"
      aria-live="polite"
      data-testid="prefs__user-types-announcement"
    >
      {{ announcement }}
    </div>
    <p>{{ t('prefs.userTypes.description') }}</p>
    <i
      v-if="!userTypes"
      class="icon icon-spinner icon-spin mt-10"
    />
    <p
      v-else-if="!userTypes.length"
      class="text-muted mt-10"
      data-testid="prefs__user-types-empty"
    >
      {{ t('prefs.userTypes.empty') }}
    </p>
    <template v-else>
      <div
        ref="list"
        class="usertype-list mt-10"
        :class="{ 'is-reordering': !!heldId }"
      >
        <TransitionGroup
          name="usertype-row"
          tag="ol"
          :aria-label="t('prefs.userTypes.label')"
        >
          <li
            v-for="userType in shownUserTypes"
            :key="userType.metadata.name"
            :data-user-type="userType.metadata.name"
            :data-testid="`prefs__user-types-row-${ userType.metadata.name }`"
            :class="{ 'usertype-row': true, held: heldId === userType.metadata.name, enabled: isEnabled(userType) }"
            role="checkbox"
            :aria-checked="isEnabled(userType)"
            :aria-description="moveKeysHint"
            tabindex="0"
            @click="toggle(userType)"
            @keydown.space.prevent="toggle(userType)"
            @keydown.enter.prevent="toggle(userType)"
            @keydown.alt.up.prevent.stop="move(userType, -1)"
            @keydown.alt.down.prevent.stop="move(userType, 1)"
          >
            <DragGrip
              v-clean-tooltip="reorderTip"
              :data-testid="`prefs__user-types-handle-${ userType.metadata.name }`"
              @mousedown="startDrag(userType.metadata.name, $event)"
            />
            <span>{{ userType.spec.displayName }}</span>
            <span class="usertype-check">
              <RcIcon
                v-if="isEnabled(userType)"
                type="checkmark"
                size="inherit"
              />
            </span>
          </li>
        </TransitionGroup>
      </div>
      <RcButton
        v-if="hasOwnPreferences"
        variant="secondary"
        size="small"
        class="mt-10"
        data-testid="prefs__user-types-reset"
        @click="reset"
      >
        {{ t('prefs.userTypes.reset') }}
      </RcButton>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  .usertype-list {
    max-width: 400px;

    ol {
      @include list-unstyled;
    }

    &.is-reordering {
      @include drag-reorder-list('.usertype-row', '.usertype-row-move');
    }
  }

  // Each row a bordered card, so they read as things to pick up and move
  .usertype-row {
    @include drag-reorder-row;

    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: var(--body-bg);
    // Off until turned on, as the table views' hidden columns
    color: var(--muted);
    cursor: pointer;

    &.enabled {
      color: var(--active, var(--primary));
    }

    & + & {
      margin-top: 6px;
    }

    &:focus-visible {
      @include focus-outline;
    }

    .usertype-check {
      display: flex;
      align-items: center;
      margin-left: auto;
    }
  }
</style>
