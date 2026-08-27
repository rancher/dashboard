<script setup lang="ts">
import { useStore } from 'vuex';
import { RcSeparator } from '@components/RcSeparator';

const store = useStore();
const t = (key: string, args?: object) => store.getters['i18n/t'](key, args);
</script>

<template>
  <div class="or-divider">
    <RcSeparator class="or-divider__rule" />
    <span class="or-divider__label">
      {{ t('login.providers.or') }}
    </span>
    <RcSeparator class="or-divider__rule" />
  </div>
</template>

<style lang="scss" scoped>
  .or-divider {
    display: flex;
    gap: 12px;
    align-items: center;

    &__rule {
      flex: 1;
      margin: 0;
    }

    &__label {
      color: var(--label-secondary);
      font-size: 11px;
      font-weight: 600;
      line-height: 16px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }
  }
</style>
