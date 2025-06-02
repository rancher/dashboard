<script setup lang="ts">

defineProps<{
  label: string;
  icon: string;
  iconColor?: string;
}>();

</script>

<template>
  <div class="status-label">
    {{ label }}
    <i :class="['icon', icon, iconColor]" />
  </div>
</template>

<style scoped lang="scss">
.status-label {
  display: flex;
  align-items: flex-end;
  gap: var(--gap);

  .icon {
    &.warning  { color: var(--warning); }
  }
}
</style>
