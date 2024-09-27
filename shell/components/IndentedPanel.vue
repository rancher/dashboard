<script>
export default {};
</script>

<template>
  <div
    class="indented-panel"
  >
    <slot />
  </div>
</template>

<style lang="scss">
  .indented-panel {
    height: 100%;
    width: 90%;
    margin-left: 5%;
  }

  @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
    .indented-panel {
      margin: 0 20px;
      width: initial;
    }
  }
</style>
