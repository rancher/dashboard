<template>
  <div
    class="page-header"
    :class="[hasBottomLine ? 'line' : '']"
  >
    <header>
      <div class="title">
        <h1 class="m-0">
          <slot name="title">
            {{ title }}
          </slot>
        </h1>
      </div>
      <div class="actions-container">
        <slot name="extra" />
      </div>
    </header>
  </div>
</template>
<script>
export default {
  props: {
    title: {
      type:    String,
      default: ''
    },
    content: {
      type:    String,
      default: ''
    },
    hasBottomLine: {
      type:    Boolean,
      default: true
    }
  }
};
</script>

<style lang="scss" scoped>

.page-header {
  &.line {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 10px;
  }
  &:not(.line) {
    margin-bottom: 20px;
  }
  .title {
    align-items: center;
    display: flex;
    h1 {
      margin: 0;
    }
  }
}

</style>
