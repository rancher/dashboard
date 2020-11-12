<script>
export default { layout: 'unauthenticated' };
</script>

<template>
  <div>
    <h1>Design System</h1>
    <section>
      <h2>Page Examples</h2>
      <nav>
        <nuxt-link to="design-system/page-examples/list" class="btn role-tertiary">
          list
        </nuxt-link>
        <nuxt-link to="design-system/page-examples/create" class="btn role-tertiary">
          create
        </nuxt-link>
        <nuxt-link to="design-system/page-examples/detail" class="btn role-tertiary">
          detail
        </nuxt-link>
      </nav>
    </section>
  </div>
</template>

<style lang='scss' scoped>
</style>
