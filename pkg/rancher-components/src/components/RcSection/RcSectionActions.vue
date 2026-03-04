<script setup lang="ts">
import { computed } from 'vue';
import RcButton from '@components/RcButton/RcButton.vue';
import RcDropdown from '@components/RcDropdown/RcDropdown.vue';
import RcDropdownTrigger from '@components/RcDropdown/RcDropdownTrigger.vue';
import RcDropdownItem from '@components/RcDropdown/RcDropdownItem.vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';

import type { ActionConfig } from './types';

const props = defineProps<{
  actions: ActionConfig[];
}>();

const primaryActions = computed(() =>
  props.actions.length < 3 ? props.actions : props.actions.slice(0, 2)
);

const overflowActions = computed(() =>
  props.actions.length < 3 ? [] : props.actions.slice(2)
);

function resolveVariant(action: typeof props.actions[number]) {
  return action.label ? 'link' : 'ghost';
}
</script>

<template>
  <RcButton
    v-for="(action, index) in primaryActions"
    :key="index"
    :class="{ 'icon-action': !action.label }"
    :variant="resolveVariant(action)"
    size="large"
    :left-icon="action.icon as any"
    @click="action.action"
  >
    <template v-if="action.label">{{ action.label }}</template>
  </RcButton>

  <RcDropdown v-if="overflowActions.length" placement="bottom-end">
    <RcDropdownTrigger class="icon-action" variant="ghost" size="small" aria-label="More actions">
      <RcIcon type="actions" size="medium" />
    </RcDropdownTrigger>

    <template #dropdownCollection>
      <RcDropdownItem
        v-for="(action, index) in overflowActions"
        :key="index"
        @click="action.action"
      >
        <template v-if="action.icon" #before>
          <RcIcon :type="action.icon as any" size="small" />
        </template>
        {{ action.label }}
      </RcDropdownItem>
    </template>
  </RcDropdown>
</template>

<style lang="scss" scoped>
.icon-action {
  &.rc-button.btn-large.variant-ghost, &.rc-button.btn-small.variant-ghost {
    width: 24px;
    padding: 0;
  }
}

button.rc-button {
  &, &:hover {
    color: var(--disabled-text);
  }
}
</style>
