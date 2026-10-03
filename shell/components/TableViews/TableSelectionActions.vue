<script setup lang="ts">
/** The bulk actions for the selected rows, as one "N Selected" menu */
import { computed } from 'vue';
import { useStore } from 'vuex';

import { RcDropdown, RcDropdownItem, RcDropdownTrigger, RcDropdownSeparator } from '@components/RcDropdown';
import IconOrSvg from '@shell/components/IconOrSvg';
import { useI18n } from '@shell/composables/useI18n';
import type { TableViewAction } from '@shell/types/table-views';

const props = withDefaults(defineProps<{
  actions?: TableViewAction[],
  /** None means no menu at all */
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
  click: [act: TableViewAction, row: null, event: MouseEvent],
  mouseover: [act: TableViewAction],
  mouseleave: [act: null],
}>();

const { t } = useI18n(useStore());

const deleteAction = computed<TableViewAction | null>(() => props.actions.find((act) => act.action === 'promptRemove') ||
  props.actions.find((act) => (!!act.icon && `${ act.icon }`.includes('icon-trash')) || /delete|remove/i.test(act.action || '')) ||
  null);

const menuActions = computed<TableViewAction[]>(() => {
  const del = deleteAction.value;

  return props.actions.filter((act) => !del || act.action !== del.action);
});

const apply = (act: TableViewAction, event: MouseEvent) => emit('click', act, null, event);
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
