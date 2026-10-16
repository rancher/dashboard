<script setup lang="ts">
/**
 * The vendor mark for an auth provider. Used throughout the login provider
 * menu. Falls back to a padlock for local auth provider.
 *
 * The mark is decorative so it is kept out of the accessibility tree.
 */
import { RcIcon } from '@components/RcIcon';

defineProps<{
  /** Vendor logo asset, or '' when the provider has none. */
  icon?: string;
}>();
</script>

<template>
  <div class="auth-provider-logo">
    <img
      v-if="icon"
      :src="icon"
      alt=""
      class="auth-provider-logo__mark"
    >
    <RcIcon
      v-else
      type="lock"
      size="large"
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

    // Vendor marks are drawn for light backgrounds, so the tile keeps the same
    // light surface in every theme
    background-color: $gray003;
    border: 1px solid var(--border);
    border-radius: var(--border-radius-lg);

    &__mark {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    // Paired with the surface above, so it has to stay dark alongside it
    .rc-icon {
      color: $gray006;
    }
  }
</style>
