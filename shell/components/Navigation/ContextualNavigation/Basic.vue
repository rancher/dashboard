<script>
export default { components: { } };
</script>

<template>
  <nav class="contextual-navigation">
    <slot />
  </nav>
</template>

<style lang="scss" scoped>
  .contextual-navigation {
    height: 100%;
    width: var(--nav-width);

    background-color: var(--nav-bg);
    border-right: var(--nav-border-size) solid var(--nav-border);

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
</style>
