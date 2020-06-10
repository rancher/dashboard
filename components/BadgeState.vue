<script>

export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  },
};
</script>

<template>
  <span :class="{'badge-state': true, [value.stateBackground]: true}">
    {{ value.stateDisplay }}
  </span>
</template>

<style lang="scss">
  .badge-state {
    padding: 5px;
    border: 1px solid transparent;
    border-radius: 2px;

    &.bg-info {
      border-color: var(--primary);
    }

    // Successful states are de-emphasized by using [text-]color instead of background-color
    &.bg-success {
      color: var(--success);
      background: transparent;
    }
  }

  .sortable-table TD .badge-state {
    @include clip;
    display: inline-block;
    max-width: 100%;
    position: relative;
    padding: 2px 8px 1px 8px;
    font-size: 1em;
    max-width: 110px;
    font-size: .85em;
    vertical-align: middle;
  }
</style>
