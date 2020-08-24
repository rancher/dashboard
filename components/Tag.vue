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
    padding: 3px 6px 1px 6px;
    font-size: 10px;
  }
</style>
