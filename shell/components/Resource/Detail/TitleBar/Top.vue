<template>
  <div class="top">
    <slot name="default" />
  </div>
</template>

<style lang="scss" scoped>
  .top {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
</style>
