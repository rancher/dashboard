<script>
export default {};
</script>

<template>
  <span class="tag">
    <slot />
  </span>
</template>

<style lang="scss" scoped>
  .tag {
    border-radius: var(--border-radius);
    color: var(--tag-primary);
    background-color: var(--tag-bg);
    padding: 4px 6px 3px 6px;
    font-size: 12px;
  }
</style>
