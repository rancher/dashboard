<script setup lang="ts">
/**
 * The signed in user's personas, most important first, which they can reorder (by dragging a row's grip, or Alt+Up / Down on a row), turn
 * off and on (a row is a checkbox, as the table views' columns), or put back to the default. Each change is saved straight away, as other
 * preferences are
 */
import { computed, nextTick, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useShell } from '@shell/apis';
import type { PersonaPreferences } from '@shell/apis/intf/shell';
import { RcButton } from '@components/RcButton';
import { RcIcon } from '@components/RcIcon';
import DragGrip from '@shell/components/DragGrip.vue';
import { useDragReorder, useListSlots } from '@shell/composables/useDragReorder';
import { useI18n } from '@shell/composables/useI18n';
import { isMac } from '@shell/utils/platform';
import { moveInOrder } from '@shell/utils/table-views/views';
import Persona from '@shell/models/customization.ui.rancher.persona';

const { t } = useI18n(useStore());
const personasApi = useShell().personas;

/** Null until loaded. Disabled ones included */
const personas = ref<Persona[] | null>(null);
const preferences = ref<PersonaPreferences>({});
const list = ref<HTMLElement | null>(null);

const hasOwnPreferences = computed(() => !!Object.keys(preferences.value).length);

const isEnabled = (persona: Persona) => !preferences.value[persona.metadata.name]?.disabled;

/** Said by a screen reader: where a moved persona went, which the focus, left on the row, doesn't show */
const announcement = ref('');

/** Cleared first, so saying the same thing twice is heard twice */
const announce = async(message: string) => {
  announcement.value = '';
  await nextTick();
  announcement.value = message;
};

const moveKeysHint = computed(() => t('prefs.personas.moveKeys', { modifier: isMac ? 'Option' : 'Alt' }));

const names = computed(() => (personas.value || []).map((persona) => persona.metadata.name));

const slots = useListSlots(list, '[data-persona]');

const showPersonas = async() => {
  personas.value = await personasApi.currentUsersPersonas({ includeDisabled: true });
  preferences.value = personasApi.currentUsersPersonaPreferences();
};

const toggle = async(persona: Persona) => {
  await personasApi.setCurrentUsersPersonaEnabled(persona.metadata.name, !isEnabled(persona));
  await showPersonas();
};

const save = async(order: string[]) => {
  await personasApi.reorderCurrentUsersPersonas(order);
  await showPersonas();
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
const shownPersonas = computed(() => {
  const all = personas.value || [];

  if (!dragOrder.value) {
    return all;
  }

  return dragOrder.value.map((name) => all.find((persona) => persona.metadata.name === name)).filter((persona): persona is Persona => !!persona);
});

/** Empty content hides the tooltip once a row is picked up */
const reorderTip = computed(() => ({ content: heldId.value ? '' : t('prefs.personas.reorder'), placement: 'left' }));

const startDrag = (name: string, event: MouseEvent) => {
  if (event.button !== 0) {
    return;
  }

  // Otherwise the pointer selects the names it crosses
  event.preventDefault();
  armDrag(name, event);
};

/** The keyboard's way to reorder: one place up or down */
const move = async(persona: Persona, step: number) => {
  const from = names.value.indexOf(persona.metadata.name);
  const to = from + step;

  if (to < 0 || to >= names.value.length) {
    return;
  }

  await save(moveInOrder(names.value, from, to));
  announce(t('prefs.personas.moved', {
    label: persona.spec.displayName, position: to + 1, total: names.value.length
  }));

  // Moving the row takes it out of the page for a moment, which drops its focus
  await nextTick();
  list.value?.querySelector<HTMLElement>(`[data-persona="${ persona.metadata.name }"]`)?.focus();
};

/** Back to the personas' own order, all enabled */
const reset = async() => {
  await personasApi.setCurrentUsersPersonaPreferences({});
  await showPersonas();
  announce(t('prefs.personas.resetDone'));
};

/**
 * Preferences for personas that were deleted, or that the user no longer has, are dropped before the list is shown
 */
onMounted(async() => {
  const mine = await personasApi.currentUsersPersonas({ includeDisabled: true });
  const mineNames = mine.map((persona) => persona.metadata.name);
  const saved = personasApi.currentUsersPersonaPreferences();
  const kept = Object.fromEntries(Object.entries(saved).filter(([name]) => mineNames.includes(name)));

  if (Object.keys(kept).length !== Object.keys(saved).length) {
    await personasApi.setCurrentUsersPersonaPreferences(kept);
  }

  await showPersonas();
});
</script>

<template>
  <div data-testid="prefs__personas">
    <div
      class="sr-only"
      role="status"
      aria-live="polite"
      data-testid="prefs__personas-announcement"
    >
      {{ announcement }}
    </div>
    <p>{{ t('prefs.personas.description') }}</p>
    <i
      v-if="!personas"
      class="icon icon-spinner icon-spin mt-10"
    />
    <p
      v-else-if="!personas.length"
      class="text-muted mt-10"
      data-testid="prefs__personas-empty"
    >
      {{ t('prefs.personas.empty') }}
    </p>
    <template v-else>
      <div
        ref="list"
        class="persona-list mt-10"
        :class="{ 'is-reordering': !!heldId }"
      >
        <TransitionGroup
          name="persona-row"
          tag="ol"
          :aria-label="t('prefs.personas.label')"
        >
          <li
            v-for="persona in shownPersonas"
            :key="persona.metadata.name"
            :data-persona="persona.metadata.name"
            :data-testid="`prefs__personas-row-${ persona.metadata.name }`"
            :class="{ 'persona-row': true, held: heldId === persona.metadata.name, enabled: isEnabled(persona) }"
            role="checkbox"
            :aria-checked="isEnabled(persona)"
            :aria-description="moveKeysHint"
            tabindex="0"
            @click="toggle(persona)"
            @keydown.space.prevent="toggle(persona)"
            @keydown.enter.prevent="toggle(persona)"
            @keydown.alt.up.prevent.stop="move(persona, -1)"
            @keydown.alt.down.prevent.stop="move(persona, 1)"
          >
            <DragGrip
              v-clean-tooltip="reorderTip"
              :data-testid="`prefs__personas-handle-${ persona.metadata.name }`"
              @mousedown="startDrag(persona.metadata.name, $event)"
            />
            <span>{{ persona.spec.displayName }}</span>
            <span class="persona-check">
              <RcIcon
                v-if="isEnabled(persona)"
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
        data-testid="prefs__personas-reset"
        @click="reset"
      >
        {{ t('prefs.personas.reset') }}
      </RcButton>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  .persona-list {
    max-width: 400px;

    ol {
      @include list-unstyled;
    }

    &.is-reordering {
      @include drag-reorder-list('.persona-row', '.persona-row-move');
    }
  }

  // Each row a bordered card, so they read as things to pick up and move
  .persona-row {
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

    .persona-check {
      display: flex;
      align-items: center;
      margin-left: auto;
    }
  }
</style>
