<script setup lang="ts">
import { computed } from 'vue';
import RcButton from '@components/RcButton/RcButton.vue';
import RcDropdown from '@components/RcDropdown/RcDropdown.vue';
import RcDropdownTrigger from '@components/RcDropdown/RcDropdownTrigger.vue';
import RcDropdownItem from '@components/RcDropdown/RcDropdownItem.vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';

import type { RcSectionActionsProps } from './types';

const props = defineProps<RcSectionActionsProps>();

const primaryActions = computed(() => (props.actions.length < 3 ? props.actions : props.actions.slice(0, 2)));

const overflowActions = computed(() => (props.actions.length < 3 ? [] : props.actions.slice(2)));
</script>

<template>
  <RcButton
    v-for="(action, index) in primaryActions"
    :key="index"
    :class="{ 'icon-action': !action.label }"
    variant="link"
    size="medium"
    :left-icon="action.label && action.icon ? (action.icon as any) : undefined"
    :aria-label="action.ariaLabel"
    @click.stop="action.action"
  >
    <RcIcon
      v-if="!action.label && action.icon"
      :type="action.icon as any"
      size="medium"
    />
    <template v-if="action.label">
      {{ action.label }}
    </template>
  </RcButton>

  <RcDropdown
    v-if="overflowActions.length"
    placement="bottom-end"
    @click.stop
  >
    <RcDropdownTrigger
      class="icon-action"
      variant="link"
      size="medium"
      aria-label="More actions"
    >
      <RcIcon
        type="actions"
        size="medium"
      />
    </RcDropdownTrigger>

    <template #dropdownCollection>
      <RcDropdownItem
        v-for="(action, index) in overflowActions"
        :key="index"
        :aria-label="action.ariaLabel"
        @click.stop="action.action"
      >
        <template
          v-if="action.icon"
          #before
        >
          <RcIcon
            :type="action.icon as any"
            size="small"
          />
        </template>
        {{ action.label }}
      </RcDropdownItem>
    </template>
  </RcDropdown>
</template>

<style lang="scss" scoped>

.rc-button.btn-medium.variant-link {
  &, &:hover {
    color: var(--rc-section-action-color);
  }
}
</style>
