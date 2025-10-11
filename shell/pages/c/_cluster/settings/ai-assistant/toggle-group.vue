<script setup lang="ts">
import { RcButton } from '@components/RcButton';

type ToggleGroupItem = {
  name: string;
  description: string;
  icon: string;
  value: string;
}

const modelValue = defineModel<string>();

defineProps < { items: ToggleGroupItem[]}>();

const update = (value: string) => {
  modelValue.value = value;
};

</script>

<template>
  <div class="toggle-group">
    <template
      v-for="item in items"
      :key="item.name"
    >
      <rc-button
        ghost
        class="toggle-group-item"
        :class="{ active: modelValue === item.value }"
        @click="update(item.value)"
      >
        <i :class="['icon', 'icon-2x', item.icon]" />
        <div toggle-group-content>
          <div class="toggle-group-item-name">
            {{ item.name }}
          </div>
          <label class="text-label toggle-group-item-description">
            {{ item.description }}
          </label>
        </div>
      </rc-button>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.toggle-group {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  gap: .75rem;
}

button {
  &.toggle-group-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;
    gap: 0.75rem;

    min-width: 16rem;
    padding: 14px 0;
    border: 2px solid var(--input-border);
    border-radius: 0.5rem;
    background: var(--body-bg);
    line-height: initial;
  }

  &.active {
    border-color: #3B82F6;
    background: rgba(59, 130, 246, 0.05);
  }

  > .icon {
    color: var(--active);
  }

  > .icon:not(:only-child) {
    margin-right: initial;
  }

  &:hover {
    > .icon {
      color: var(--active-hover);
    }
  }
}

.toggle-group-item-name {
  font-weight: bold;
}

.toggle-group-item-description {
  font-size: 0.90rem;

  &:hover {
    cursor: pointer;
  }
}
</style>
