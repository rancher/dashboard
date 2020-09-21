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
    padding: 2px 10px 1px 10px;
    border: 1px solid transparent;
    border-radius: 20px;

    &.bg-info {
      border-color: var(--primary);
    }

    &.bg-error {
      border-color: var(--error);
    }

    &.bg-warning {
      border-color: var(--warning);
    }

    // Successful states are de-emphasized by using [text-]color instead of background-color
    &.bg-success {
      color: var(--success);
      background: transparent;
      border: 0;
    }
  }

  .sortable-table TD .badge-state {
    @include clip;
    display: inline-block;
    max-width: 100%;
    position: relative;
    max-width: 110px;
    font-size: .85em;
    vertical-align: middle;
  }
</style>
