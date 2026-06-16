<script setup lang="ts">

interface SubHeaderItem {
  icon: string;
  iconTooltip?: Record<{key?: string, text?: string}>;
  label: string;
  labelTooltip?: string;
}

defineProps<{
  items: SubHeaderItem[];
}>();

</script>

<template>
  <div class="app-chart-card-sub-header">
    <div
      v-for="(subHeaderItem, i) in items"
      :key="i"
      class="app-chart-card-sub-header-item"
      data-testid="app-chart-card-sub-header-item"
    >
      <i
        v-clean-tooltip="t(subHeaderItem.iconTooltip.key)"
        :class="['icon', 'app-chart-card-sub-header-item-icon', subHeaderItem.icon]"
      />
      <p v-clean-tooltip="subHeaderItem.labelTooltip">
        {{ subHeaderItem.label }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-chart-card-sub-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap) var(--gap-md);
  color: var(--link-text-secondary);
  margin-bottom: 8px;

  &-item {
    display: flex;
    align-items: center;
  }

  &-item-icon {
    width: 20px;
    height: 20px;
    display: flex;
    font-size: 19px;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
  }
}
</style>
