<script setup lang="ts">
import { RcButton } from '@components/RcButton';
import AuthProviderLogo from '@shell/components/auth/login/AuthProviderLogo.vue';
import type { AuthProviderOption } from '@shell/utils/auth-providers';

defineProps<{ option: AuthProviderOption }>();

defineEmits<{(e: 'select', option: AuthProviderOption): void }>();
</script>

<template>
  <RcButton
    type="button"
    variant="ghost"
    size="large"
    class="auth-provider-option"
    :data-testid="`login-provider-option-${ option.id }`"
    @click="$emit('select', option)"
  >
    <template #before>
      <AuthProviderLogo :icon="option.icon" />
    </template>
    <span class="auth-provider-option__text">
      <span class="auth-provider-option__name">
        {{ option.name }}
      </span>
      <span class="auth-provider-option__meta">
        {{ option.meta }}
      </span>
    </span>
  </RcButton>
</template>

<style lang="scss" scoped>
  .rc-button.auth-provider-option {
    --rc-button-padding: 9px 10px;

    justify-content: flex-start;
    width: 100%;
    text-align: left;

    color: var(--body-text);
    border-radius: var(--border-radius);

    &:hover {
      // The global button styles turn text `--lightest` on hover, which would
      // wash the name out against this background.
      color: var(--body-text);
      background-color: var(--dropdown-hover-bg);
    }

    .auth-provider-option__text {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
      flex: 1;
    }

    .auth-provider-option__name {
      font-size: 14px;
      font-weight: 700;
      line-height: 20px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .auth-provider-option__meta {
      color: var(--label-secondary);
      font-size: 12px;
      line-height: 17px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>
