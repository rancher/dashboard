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
      <h2> button testing</h2>

      <h3>default</h3>
      <button
        type="button"
        class="btn role-primary"
      >
        Primary
      </button>
      <button
        type="button"
        class="btn role-secondary"
      >
        Secondary
      </button>
      <button
        type="button"
        class="btn role-tertiary"
      >
        <t k="generic.default" />
      </button>

      <h3>large</h3>
      <button
        type="button"
        class="btn role-primary btn-lg"
      >
        Primary
      </button>
      <button
        type="button"
        class="btn role-secondary btn-lg"
      >
        Secondary
      </button>
      <button
        type="button"
        class="btn role-tertiary btn-lg"
      >
        <t k="generic.default" />
      </button>

      <h3>small</h3>
      <button
        type="button"
        class="btn role-primary btn-sm"
      >
        Primary
      </button>
      <button
        type="button"
        class="btn role-secondary btn-sm"
      >
        Secondary
      </button>
      <button
        type="button"
        class="btn role-tertiary btn-sm"
      >
        <t k="generic.default" />
      </button>

      <h3>xs</h3>
      <button
        type="button"
        class="btn role-primary btn-xs"
      >
        Primary
      </button>
      <button
        type="button"
        class="btn role-secondary btn-xs"
      >
        Secondary
      </button>
      <button
        type="button"
        class="btn role-tertiary btn-xs"
      >
        <t k="generic.default" />
      </button>
    </section>
  </div>
</template>

<style lang='scss' scoped>
</style>
