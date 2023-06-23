<script>
export default { layout: 'default' };
</script>

<template>
  <div id="my-prod-layout">
    <h1>THIS SHOULD BE MY BASE LAYOUT!!!!</h1>
    <router-view />
  </div>
</template>

<style lang="scss" scoped>
#my-prod-layout {
  border: 3px solid red;
}
</style>
