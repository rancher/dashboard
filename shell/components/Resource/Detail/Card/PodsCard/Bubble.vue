<template>
  <span class="bubble">
    <slot name="default" />
  </span>
</template>

<style lang="scss" scoped>
.bubble {
    border-radius: 40%;
    background-color: var(--bubble-bg);
    padding: 2px 6px;
}
</style>
