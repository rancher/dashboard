<script setup lang="ts">
/**
 * The vendor mark for an auth provider. Used by the login provider menu and the
 * auth provider list. Falls back to a padlock for the local auth provider.
 *
 * The mark is decorative so it is kept out of the accessibility tree.
 */
import { RcIcon } from '@components/RcIcon';

withDefaults(defineProps<{
  icon?: string;
  size?: 'default' | 'small';
}>(), { size: 'default' });
</script>

<template>
  <div
    class="auth-provider-logo"
    :class="{ 'auth-provider-logo--small': size === 'small' }"
  >
    <img
      v-if="icon"
      :src="icon"
      alt=""
      class="auth-provider-logo__mark"
    >
    <RcIcon
      v-else
      type="lock"
      :size="size === 'small' ? 'medium' : 'large'"
    />
  </div>
</template>

<style lang="scss" scoped>
@import "~shell/assets/styles/base/_color.scss";

  .auth-provider-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    box-sizing: border-box;
    width: 42px;
    height: 42px;

    background-color: $gray003;
    border-radius: var(--border-radius-lg);

    &__mark {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    &--small {
      width: 28px;
      height: 28px;
      border-radius: var(--border-radius);

      .auth-provider-logo__mark {
        width: 18px;
        height: 18px;
      }
    }

    .rc-icon {
      color: $gray006;
    }
  }
</style>
