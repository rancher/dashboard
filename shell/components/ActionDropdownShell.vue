<script setup lang="ts">
import { RcDropdown, RcDropdownTrigger, RcDropdownItem } from '@rc/RcDropdown';
type HiddenAction = {
  action: string;
  enabled: boolean;
  icon: string;
  label: string;
  bulkable: boolean;
  bulkAction: string;
  allEnabled: boolean;
  anyEnabled: boolean;
}

defineProps<{
  disabled: boolean,
  hiddenActions: HiddenAction[],
  actionTooltip: unknown,
}>();

const emit = defineEmits(['click', 'mouseover', 'mouseleave']);

const applyTableAction = (act: HiddenAction, args: unknown, event: Event) => {
  emit('click', act, args, event);
};

const setBulkActionOfInterest = (act: HiddenAction | null, event: 'mouseover' | 'mouseleave' = 'mouseover') => {
  emit(event, act);
};
</script>

<template>
  <rc-dropdown
    :distance="14"
    placement="bottom"
  >
    <rc-dropdown-trigger
      class="bulk-actions-dropdown"
      :disabled="disabled"
    >
      <template #before>
        <i class="icon icon-gear" />
      </template>
      <span>{{ t('sortableTable.bulkActions.collapsed.label') }}</span>
      <template #after>
        <i class="ml-10 icon icon-chevron-down" />
      </template>
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <rc-dropdown-item
        v-for="(act, i) in hiddenActions"
        :key="i"
        v-clean-tooltip="{
          content: actionTooltip,
          placement: 'right'
        }"
        :disabled="!act.enabled"
        @click="applyTableAction(act, null, $event)"
        @mouseover="setBulkActionOfInterest(act)"
        @mouseleave="setBulkActionOfInterest(null, 'mouseleave')"
      >
        <template #before>
          <i
            v-if="act.icon"
            :class="act.icon"
          />
        </template>
        <span v-clean-html="act.label" />
      </rc-dropdown-item>
    </template>
  </rc-dropdown>
</template>
