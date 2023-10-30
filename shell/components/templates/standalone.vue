<script>
export default { middleware: ['unauthenticated'] };
</script>

<template>
  <router-view :key="$route.path" />
</template>

<style lang="scss">
body, #__nuxt, #__layout {
  height: 100%;
}
</style>
