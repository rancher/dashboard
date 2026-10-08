<script setup lang="ts">
import { RcIcon } from '@components/RcIcon';
</script>

<template>
  <div
    class="auth-providers-prime"
    data-testid="auth-config-prime-notice"
  >
    <RcIcon
      type="lock"
      size="medium"
      class="auth-providers-prime__icon"
    />
    <div class="auth-providers-prime__body">
      <h3 class="auth-providers-prime__title">
        {{ t('authConfig.list.prime.title') }}
      </h3>
      <p class="auth-providers-prime__description">
        {{ t('authConfig.list.prime.description') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-providers-prime {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 8px;
  padding: 16px;

  background-color: var(--body-bg);
  border: 1px dashed var(--border);
  border-radius: var(--border-radius-lg);

  &__icon {
    color: var(--label-secondary);
    margin-top: 2px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    margin: 0;
    color: var(--label-secondary);
    font-size: 14px;
    font-weight: 600;
    line-height: 21px;
  }

  &__description {
    margin: 0;
    color: var(--label-secondary);
    font-size: 12px;
    line-height: 18px;
  }
}
</style>
