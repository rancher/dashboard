<script setup lang="ts">
import { RcDropdownItem } from '@components/RcDropdown';
import AuthProviderLogo from '@shell/components/auth/login/AuthProviderLogo.vue';
import type { AuthProviderOption } from '@shell/utils/auth-providers';

defineProps<{ option: AuthProviderOption }>();

defineEmits<{(e: 'select', option: AuthProviderOption): void }>();
</script>

<template>
  <RcDropdownItem
    class="auth-provider-option"
    :data-testid="`login-provider-option-${ option.id }`"
    @click="$emit('select', option)"
  >
    <template #before>
      <AuthProviderLogo :icon="option.icon" />
    </template>
    <div class="auth-provider-option__text">
      <div class="auth-provider-option__name">
        {{ option.name }}
      </div>
      <div class="auth-provider-option__meta">
        {{ option.meta }}
      </div>
    </div>
  </RcDropdownItem>
</template>

<style lang="scss" scoped>
  .auth-provider-option {
    gap: 12px;
    padding: 9px 10px;

    &__text {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
      flex: 1;
    }

    &__name {
      font-size: 14px;
      font-weight: 700;
      line-height: 20px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__meta {
      color: var(--dropdown-group-text);
      font-size: 12px;
      line-height: 17px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>
