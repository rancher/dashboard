<script>

export default {
  props: {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      required: true
    },
  },
};
</script>

<template>
  <span :class="{'badge-state': true, [row.stateBackground]: true}">
    {{ row.stateDisplay }}
  </span>
</template>

<style lang="scss">
  @import "@/assets/styles/base/_mixins.scss";

  .badge-state {
    padding: 5px;
    border: 1px solid transparent;
    border-radius: 100px;
    text-transform: capitalize;

    // Successful states are de-emphasized by using [text-]color instead of background-color
    &.bg-success {
      background-color: transparent;
      border: 1px solid var(--success);
      color: var(--success);
    }
  }

  .sortable-table TD .badge-state {
    @include clip;
    display: inline-block;
    max-width: 100%;
    position: relative;
    padding: 1px 10px;
    font-size: 1em;
    max-width: 110px;
    font-size: .85em;
  }
</style>
