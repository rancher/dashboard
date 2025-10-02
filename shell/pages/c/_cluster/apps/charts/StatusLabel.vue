<script setup lang="ts">

defineProps<{
  label: string;
  icon?: string;
  iconColor?: string;
  tooltip?: string;
}>();

</script>

<template>
  <div class="status-label">
    {{ label }}
    <i
      v-if="icon"
      v-clean-tooltip.right="tooltip"
      :class="['icon', icon, iconColor]"
    />
  </div>
</template>

<style scoped lang="scss">
.status-label {
  display: flex;
  align-items: flex-end;
  gap: var(--gap);
  margin-left: 4px;

  .icon {
    &.warning  { color: var(--warning); }
  }
}
</style>
