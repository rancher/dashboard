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
    border: 1px solid var(--tag-primary);
    border-radius: var(--border-radius);
    color: var(--tag-primary);
    background-color: var(--tag-bg);
    padding: 3px 5px 2px 5px;
    font-size: 12px;
  }
</style>
