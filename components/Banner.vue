<script>
export default {
  props: {
    color: {
      type:    String,
      default: 'secondary'
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
  <div class="banner" :class="{[color]: true}">
    <slot>
      <t v-if="labelKey" :k="labelKey" />
      <template v-else>
        {{ label }}
      </template>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
  .banner {
    padding: 10px;
    margin: 15px 0;
    width: 100%;
    border-radius: var(--border-radius);
    transition: all 0.2s ease;

    &.primary {
      background: var(--primary);
      border: solid 1px var(--primary);
      color: var(--body-text);
    }

    &.secondary {
      background: var(--secondary-banner-bg);
      border: solid 1px var(--secondary);
      color: var(--body-text);
    }

    &.success {
      background: var(--success-banner-bg);
      border: solid 1px var(--success);
      color: var(--body-text);
    }

    &.info {
      background: var(--info-banner-bg);
      border: solid 1px var(--info);
      color: var(--body-text);
    }

    &.warning {
      background: var(--warning-banner-bg);
      border: solid 1px var(--warning);
      color: var(--body-text);
    }

    &.error {
      background: var(--error-banner-bg);
      border: solid 1px var(--error);
      color: var(--error);
    }
  }
</style>
