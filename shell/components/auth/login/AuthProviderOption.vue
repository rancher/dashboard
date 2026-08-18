<script setup lang="ts">
import { RcButton } from '@components/RcButton';
import { RcTag } from '@components/Pill';
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
      <span
        v-if="option.description"
        class="auth-provider-option__description"
      >
        {{ option.description }}
      </span>
      <RcTag
        type="inactive"
        class="auth-provider-option__tag"
      >
        <span class="auth-provider-option__meta">
          {{ option.meta }}
        </span>
      </RcTag>
    </span>
  </RcButton>
</template>

<style lang="scss" scoped>
@import "~shell/assets/styles/base/_variables.scss";

  .rc-button.auth-provider-option {
    --rc-button-padding: 12px 16px;

    justify-content: flex-start;
    align-items: center;
    width: 100%;
    text-align: left;

    // The global button styles hold their label on one line, which would send a
    // long name or description out past the row.
    white-space: normal;

    color: var(--body-text);
    border-radius: var(--border-radius);
    border-bottom: 1px solid var(--border);

    &:hover {
      // The global button styles turn text `--lightest` on hover, which would
      // wash the name out against this background.
      color: var(--body-text);
      background-color: var(--dropdown-hover-bg);
    }

    .auth-provider-option__text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      min-width: 0;
      flex: 1;
    }

    .auth-provider-option__name {
      max-width: 100%;
      font-size: 14px;
      font-weight: 700;
      line-height: 21px;
      overflow-wrap: anywhere;
    }

    .auth-provider-option__description {
      max-width: 100%;
      color: var(--label-secondary);
      font-size: 12px;
      line-height: 18px;
      overflow-wrap: anywhere;
    }

    .auth-provider-option__tag {
      max-width: 100%;
    }

    .auth-provider-option__meta {
      color: var(--label-secondary);

      font-family: $mono-font;
      font-size: 12px;
      line-height: 18px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
