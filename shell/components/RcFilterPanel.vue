<script setup lang="ts">
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

type FilterOption = {
  type?: 'default' | 'custom';
  value?: string;
  label?: string;
};

type FilterGroup = {
  key: string;
  title: string;
  options: FilterOption[];
};

const props = defineProps<{
  modelValue: Record<string, string[]>;
  filters: FilterGroup[];
}>();

const emit = defineEmits<{(e: 'update:modelValue', val: Record<string, string[]>): void;}>();

const updateFilter = (key: string, value: string[]) => {
  const newValue = { ...props.modelValue, [key]: value };

  emit('update:modelValue', newValue);
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
        v-for="option in filter.options"
        :key="`${filter.key}-${option.value}`"
        class="filter-panel-filter-option"
      >
        <template v-if="option.type === 'custom'">
          <slot
            name="custom-option"
            :option="option"
            :filter="filter"
          />
        </template>
        <template v-else>
          <Checkbox
            class="filter-panel-filter-checkbox"
            :label="option.label"
            :value="modelValue[filter.key]"
            :value-when-true="option.value"
            @update:value="updateFilter(filter.key, $event)"
          >
            <template #label>
              <span>{{ option.label }}</span>
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
    gap: 8px;
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
        max-width: 240px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        color: var(--link-text-secondary);
      }
    }
  }
}
</style>
