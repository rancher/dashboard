<template>
  <div class="spaced-row">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.spaced-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-flow: dense;
  grid-gap: 24px;
}
</style>
