<script>
export default {
  props: {
    color: {
      type:    String,
      default: 'warning'
    },
    label: {
      type:    String,
      default: null,
    },
    labelKey: {
      type:    String,
      default: null,
    },
  }
};
</script>
<template>
  <span class="flag" :class="{[color]: true}">
    <slot>
      <t v-if="labelKey" :k="labelKey" />
      <template v-else>{{ label }}</template>
    </slot>
  </span>
</template>

<style lang="scss" scoped>
  .flag {
    text-align: center;
    display: inline-block;
    vertical-align: middle;
    font-size: 10px;
    padding: 0 0 0 10px;
    border-radius: 2px 0 0 2px;

    &.success {
      background: var(--success);
      &:after {
        border-color: var(--success-border);
      }
    }

    &.info {
      background: var(--info);
      &:after {
        border-color: var(--info-border);
      }
    }

    &.warning {
      background: var(--warning);
      &:after {
        border-color: var(--warning-border);
      }
    }

    &.error {
      background: var(--error);
      &:after {
        border-color: var(--error-border);
      }
    }

    &:after {
      content: "";
      display: inline-block;
      vertical-align: middle;
      position: relative;
      right: -10px;
      height: 100%;
      border-width: 10px;
      border-style: solid;
      border-right-color: transparent !important;
    }
  }
</style>
