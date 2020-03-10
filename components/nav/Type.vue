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
      <span class="label">
        <i class="icon" :class="{'icon-folder': type.namespaced, 'icon-globe': !type.namespaced}" />
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
    A {
      display: grid;
      grid-template-areas: "label count";
      grid-template-columns: auto auto;
      grid-column-gap: 5px;
      font-size: 12px;
      padding: 7px 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .label {
      grid-area: label;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;

      .icon {
        position: relative;
        top: -2px;
      }
    }

    .count {
      grid-area: count;
      font-size: 12px;
      text-align: right;
      justify-items: center;
    }
  }
</style>
