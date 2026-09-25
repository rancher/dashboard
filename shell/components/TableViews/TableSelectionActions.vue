<script setup lang="ts">
/**
 * The bulk actions for the rows a table has selected, as one "N Selected" menu.
 *
 * Replaces the row of individual action buttons while the table views toolbar is in use: the
 * toolbar's own row is where the filter lives, so the actions collapse into a single button that
 * is only there when there is a selection to act on.
 */
import { computed } from 'vue';
import { useStore } from 'vuex';

import { RcDropdown, RcDropdownItem, RcDropdownTrigger, RcDropdownSeparator } from '@components/RcDropdown';
import IconOrSvg from '@shell/components/IconOrSvg';
import { useI18n } from '@shell/composables/useI18n';
import type { TableAction } from '@shell/types/table-views';

const props = withDefaults(defineProps<{
  /** The table's availableActions */
  actions?: TableAction[],
  /** How many rows are selected. None means no menu at all */
  count?: number,
  actionTooltip?: string | Record<string, unknown> | null,
  testid?: string,
}>(), {
  actions:       () => [],
  count:         0,
  actionTooltip: null,
  testid:        'sortable-table',
});

const emit = defineEmits<{
  click: [act: TableAction, row: null, event: MouseEvent],
  mouseover: [act: TableAction],
  mouseleave: [act: null],
}>();

const { t } = useI18n(useStore());

/**
 * Removing rows is the one action that can't be undone, so it sits on its own below a separator
 * rather than in amongst the rest
 */
const deleteAction = computed<TableAction | null>(() => props.actions.find((act) => act.action === 'promptRemove') ||
  props.actions.find((act) => (!!act.icon && `${ act.icon }`.includes('icon-trash')) || /delete|remove/i.test(act.action || '')) ||
  null);

const menuActions = computed<TableAction[]>(() => {
  const del = deleteAction.value;

  return props.actions.filter((act) => !del || act.action !== del.action);
});

const apply = (act: TableAction, event: MouseEvent) => emit('click', act, null, event);
</script>

<template>
  <rc-dropdown
    v-if="count"
    :distance="4"
    placement="bottom-start"
  >
    <rc-dropdown-trigger
      variant="primary"
      size="medium"
      class="selection-trigger"
      :data-testid="`${ testid }-selection-actions`"
    >
      {{ t('tableViews.bulk.selected', { count }) }}
      <template #after>
        <i class="icon icon-chevron-down" />
      </template>
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <rc-dropdown-item
        v-for="(act, i) in menuActions"
        :key="i"
        v-clean-tooltip="{ content: actionTooltip, placement: 'right' }"
        :disabled="!act.enabled"
        :data-testid="`${ testid }-selection-action-${ act.action }`"
        @click="apply(act, $event)"
        @mouseover="emit('mouseover', act)"
        @mouseleave="emit('mouseleave', null)"
      >
        <template #before>
          <!-- An action's icon is a font class or an svg the extension supplied. This is the one
               component that draws either, which is how the row action menu draws them too. -->
          <IconOrSvg
            v-if="act.icon || act.svg"
            :icon="act.icon"
            :src="act.svg"
            class="icon"
          />
        </template>
        <span v-clean-html="act.label" />
      </rc-dropdown-item>

      <template v-if="deleteAction">
        <rc-dropdown-separator v-if="menuActions.length" />
        <rc-dropdown-item
          v-clean-tooltip="{ content: actionTooltip, placement: 'right' }"
          :disabled="!deleteAction.enabled"
          :data-testid="`${ testid }-selection-action-delete`"
          @click="apply(deleteAction, $event)"
          @mouseover="emit('mouseover', deleteAction)"
          @mouseleave="emit('mouseleave', null)"
        >
          <template #before>
            <IconOrSvg
              :icon="deleteAction.icon || 'icon icon-delete'"
              :src="deleteAction.svg"
              class="icon"
            />
          </template>
          <span>{{ t('tableViews.bulk.deleteSelected') }}</span>
        </rc-dropdown-item>
      </template>
    </template>
  </rc-dropdown>
</template>

<style lang="scss" scoped>
.selection-trigger {
  white-space: nowrap;
}
</style>
