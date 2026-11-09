<script setup lang="ts">
/**
 * The standard drawer footer: a secondary button that closes the drawer, then
 * the drawer's primary action. Put it in an `RcDrawer`'s `footer` slot. Label
 * the buttons with `secondaryLabel` and `primaryLabel`, or replace either one
 * with the `secondary` and `primary` slots.
 */
import { inject } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import RcButton from '@components/RcButton/RcButton.vue';
import { defaultContext } from './types';
import type { DrawerContext, RcDrawerFooterProps } from './types';

defineProps<RcDrawerFooterProps>();

const emit = defineEmits<{
  primary: [];
}>();

const { close, closeAriaLabel } = inject<DrawerContext>('drawerContext', defaultContext, true);

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <div class="rc-drawer-footer">
    <!-- @slot Replaces the secondary button, for one that needs more than a label. It receives `close`, which closes the drawer. -->
    <slot
      name="secondary"
      :close="close"
    >
      <RcButton
        variant="secondary"
        size="large"
        :aria-label="secondaryLabel ? undefined : closeAriaLabel"
        data-testid="rc-drawer-footer-secondary"
        @click="close"
      >
        {{ secondaryLabel || t('component.drawer.chrome.close') }}
      </RcButton>
    </slot>
    <!-- @slot Replaces the primary button, for one that needs more than a label, such as an icon, a test id or a split button, or for several actions. Make them `size="large"`. It receives `close`, which closes the drawer. -->
    <slot
      name="primary"
      :close="close"
    >
      <RcButton
        v-if="primaryLabel"
        variant="primary"
        size="large"
        data-testid="rc-drawer-footer-primary"
        @click="emit('primary')"
      >
        {{ primaryLabel }}
      </RcButton>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
.rc-drawer-footer {
  display: contents;
}
</style>
