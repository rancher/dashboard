<script setup lang="ts">
import {
  RcDropdown,
  RcDropdownTrigger,
  RcDropdownItemCheckbox,
  RcDropdownItemSelect,
} from '@components/RcDropdown';

defineProps({
  range: {
    type:    String,
    default: '',
  },
  rangeOptions: {
    type: Array,
    default() {
      return [];
    },
  },
  wrap:       Boolean,
  timestamps: Boolean,
});

defineEmits([
  'toggleRange',
  'toggleWrap',
  'toggleTimestamps',
]);

</script>

<template>
  <rc-dropdown>
    <rc-dropdown-trigger
      class="condensed"
    >
      <i
        class="icon icon-gear"
        :alt="t('wm.containerLogs.options')"
      />
      <template #after>
        <i
          class="icon icon-chevron-up"
          :alt="t('wm.containerLogs.expand')"
        />
      </template>
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <rc-dropdown-item-select
        :model-value="range"
        :options="rangeOptions"
        :label="t('wm.containerLogs.range.label')"
        @select="$emit('toggleRange', $event)"
      />
      <rc-dropdown-item-checkbox
        :model-value="wrap"
        @click="$emit('toggleWrap', $event)"
      >
        {{ t('wm.containerLogs.wrap') }}
      </rc-dropdown-item-checkbox>
      <rc-dropdown-item-checkbox
        :model-value="timestamps"
        @click="$emit('toggleTimestamps', $event)"
      >
        {{ t('wm.containerLogs.timestamps') }}
      </rc-dropdown-item-checkbox>
    </template>
  </rc-dropdown>
</template>

<style lang="scss" scoped>
  .condensed {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    min-height: 30px;
  }
</style>
