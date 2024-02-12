<template>
  <header>
    <slot />
  </header>
</template>

<style lang="scss" scoped>
  header {
    display: flex;
    align-items: center;
    border-bottom: var(--header-border-size) solid var(--header-border);
    height: 55px;

    > * {
      background-color: var(--header-bg);
    }
  }
</style>
