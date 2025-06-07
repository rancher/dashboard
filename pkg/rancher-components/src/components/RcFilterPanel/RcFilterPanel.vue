<script setup lang="ts">
import { computed, DefineComponent } from 'vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

/**
 * Generic type for the passed components as props
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentType = DefineComponent<any, any, any>;

/**
 * A single filter option for a group (e.g., a single checkbox).
 */
type FilterOption = {
  /** Value to apply when selected */
  value?: string;
  /** Optional custom component to render for this option (e.g., link or button) */
  component?: ComponentType;
  /** Props passed to the custom component */
  componentProps?: Record<string, unknown>;
  /** Label to show next to the checkbox, or a custom component next to the checkbox */
  label?: string | { component: ComponentType; componentProps: Record<string, unknown>; };
};

/**
 * A group of filter options (e.g., Repositories, Categories).
 */
type FilterGroup = {
  /** Key that maps to the filters object (e.g., 'repos', 'categories') */
  key: string;
  /** Title for the filter group */
  title: string;
  /** The available options within this group */
  options: FilterOption[];
};

/**
 * Props accepted by the filter panel.
 *
 * Supports either v-model or value + @filter-change.
 */
const props = defineProps<{
  /** Two-way bound filters (if using v-model) */
  modelValue?: Record<string, string[]>;
  /** One-way bound filters (if using value and @filter-change) */
  value?: Record<string, string[]>;
  /** The list of filter groups to display */
  filters: FilterGroup[];
}>();

/**
 * Events emitted by the component.
 * - update:modelValue is emitted when using v-model.
 * - filter-change is emitted for manual update handling.
 */
const emit = defineEmits<{(e: 'update:modelValue', val: Record<string, string[]>): void; (e: 'filter-change', val: Record<string, string[]>): void;}>();

/**
 * Determine which value to use for current filters.
 * Prioritizes modelValue (v-model), then value, or defaults to an empty object.
 */
const currentValue = computed(() => {
  if (props.modelValue !== undefined) {
    return props.modelValue;
  } else if (props.value !== undefined) {
    return props.value;
  } else {
    return {};
  }
});

/**
 * To know if the user is using v-model
 */
const isUsingVModel = computed(() => props.modelValue !== undefined);

/**
 * Handles updating the selected filters for a given filter group key.
 *
 * @param key - The key of the filter group being updated (e.g., 'tags').
 * @param value - The updated list of selected values.
 */
const updateFilter = (key: string, value: string[]) => {
  const newValue = { ...currentValue.value, [key]: value };

  if (isUsingVModel.value) {
    emit('update:modelValue', newValue);
  } else {
    emit('filter-change', newValue);
  }
};

</script>

<template>
  <div class="filter-panel">
    <div
      v-for="filter in filters"
      :key="filter.key"
      class="filter-panel-filter-group"
    >
      <h4 class="filter-panel-filter-group-title">
        {{ filter.title }}
      </h4>
      <div
        v-for="(option, i) in filter.options"
        :key="`${filter.key}-${i}`"
        class="filter-panel-filter-option"
      >
        <template v-if="option.component">
          <component
            :is="option.component"
            v-bind="option.componentProps"
          />
        </template>
        <template v-else>
          <Checkbox
            :key="i"
            class="filter-panel-filter-checkbox"
            :label="typeof option.label === 'string' ? option.label : undefined"
            :value="currentValue[filter.key]"
            :value-when-true="option.value"
            :data-testid="`filter-panel-filter-checkbox-${i}`"
            @update:value="updateFilter(filter.key, $event)"
          >
            <template #label>
              <span v-if="typeof option.label === 'string'">{{ option.label }}</span>
              <component
                :is="option.label.component"
                v-else
                v-bind="option.label.componentProps"
              />
            </template>
          </Checkbox>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.filter-panel {
  display: flex;
  min-width: 250px;
  height: max-content;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  border-radius: 6px;
  background: var(--sortable-table-header-bg);

  &-filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;

    &-title {
      margin-bottom: 6px;
      font-size: 16px;
      font-weight: 600;
      line-height: 23px;
    }
  }

  &-filter-option {
    width: 100%;

    .filter-panel-filter-checkbox {

      .checkbox-label span {
        max-width: 200px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        color: var(--link-text-secondary);
        margin-left: 4px;
      }
    }
  }
}
</style>
