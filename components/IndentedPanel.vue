<script>
export default {};
</script>

<template>
  <div class="indented-panel" v-on="$listeners">
    <slot />
  </div>
</template>

<style lang="scss">
  .indented-panel {
    width: 90%;
    margin-left: 5%;
  }

  @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
    .indented-panel {
      margin-left: 0;
      width: 100%;
    }
  }  
</style>
