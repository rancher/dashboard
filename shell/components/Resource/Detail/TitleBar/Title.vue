<template>
  <h1 class="title">
    <slot name="default" />
  </h1>
</template>

<style lang="scss" scoped>
  h1.title {
    display: inline-block;
    align-items: center;
    display: flex;
    flex-direction: row;
  }
</style>
