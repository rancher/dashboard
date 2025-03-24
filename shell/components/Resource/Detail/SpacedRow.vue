<template>
  <div class="spaced-row">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.spaced-row {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  column-gap: 24px;

  &:deep() > * {
    flex: 1;
  }
}
</style>
