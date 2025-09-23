<template>
  <div class="spaced-row">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.spaced-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));;
  grid-auto-flow: dense;
  grid-gap: 24px;
  justify-content: space-evenly;
}
</style>
