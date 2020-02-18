<script>
export default {
  props: {
    type: {
      type:     Object,
      required: true
    }
  }
};
</script>

<template>
  <n-link :key="type.name" :to="type.route" tag="li" class="child">
    <a>
      <span v-trim-whitespace class="label">
        <i v-if="type.namespaced" class="icon icon-folder mr-5" />
        {{ type.label }}
      </span>
      <span v-if="typeof type.count !== 'undefined'" class="count">
        {{ type.count }}
      </span>
    </a>
  </n-link>
</template>

<style lang="scss" scoped>
  .child {
    width: calc(100% - 5px);
    position: relative;
    left: 2px;

    A {
      display: grid;
      grid-template-areas: "label count";
      grid-template-columns: auto 40px;
      font-size: 12px;
      padding: 10px 0 10px 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .label {
      grid-area: label;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .count {
      grid-area: count;
      font-size: 12px;
      text-align: right;
      justify-items: center;
      padding-right: 10px;
    }

    &.nuxt-link-active {
      background-color: var(--nav-active);
      padding: 0;

      a {
        color: var(--lightest) !important;
      }
    }
  }
</style>
