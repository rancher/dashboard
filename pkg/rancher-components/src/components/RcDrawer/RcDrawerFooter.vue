<script setup lang="ts">
/**
 * The standard drawer footer: a Close button followed by the drawer's actions.
 * Put it in an `RcDrawer`'s `footer` slot, whose Close button it closes.
 */
import { inject } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import RcButton from '@components/RcButton/RcButton.vue';
import { DrawerContext, defaultContext } from './types';

const { close, closeAriaLabel } = inject<DrawerContext>('drawerContext') || defaultContext;

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <div class="rc-drawer-footer">
    <RcButton
      variant="secondary"
      size="large"
      :aria-label="closeAriaLabel"
      @click="close"
    >
      {{ t('component.drawer.chrome.close') }}
    </RcButton>
    <!-- @slot The drawer's actions, after Close. Make them `size="large"`, with `variant="primary"` for the main one. -->
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.rc-drawer-footer {
  display: contents;
}
</style>
