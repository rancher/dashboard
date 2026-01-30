<script setup lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { computed } from 'vue';
import { Props } from './types';
import RcButton from '@components/RcButton/RcButton.vue';

const props = defineProps<Props>();
const emit = defineEmits(['close']);

const store = useStore();
const i18n = useI18n(store);

const ariaLabel = computed(() => i18n.t('component.drawer.chrome.ariaLabel.close', { target: props.ariaTarget }));

</script>
<template>
  <div class="chrome">
    <div class="header pp-4">
      <slot name="header">
        <div class="title">
          <slot name="title" />
        </div>
        <div class="actions">
          <button
            class="btn role-link"
            :aria-label="ariaLabel"
            @click="emit('close')"
          >
            <i class="icon icon-close" />
          </button>
        </div>
      </slot>
    </div>
    <div class="body pp-4">
      <slot name="body" />
    </div>
    <div
      v-if="!removeFooter"
      class="footer pp-4"
    >
      <slot name="footer">
        <div class="actions">
          <RcButton
            variant="secondary"
            size="large"
            :aria-label="ariaLabel"
            @click="emit('close')"
          >
            {{ i18n.t('component.drawer.chrome.close') }}
          </RcButton>
          <slot name="additional-actions" />
        </div>
      </slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chrome {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    display: flex;
    flex-direction: column;

    & >.header {
      display: flex;
      flex-direction: row;
      align-items: center;

      background-color: var(--body-bg);
      border-bottom: 1px solid var(--border);
      height: var(--header-height);

      & > .title {
        display: flex;
        align-items: center;
        flex: 1;
        font-size: 16px;
      }

      & > .actions {
        button {
          display: inline-flex;
          $size: 24px;
          width: $size;
          height: $size;
          color: var(--body-text);

          justify-content: center;
        }
      }
    }

    .body {
      background-color: var(--drawer-body-bg);
      flex: 1;
      overflow-y: scroll;
    }

    .footer {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;

        background-color: var(--body-bg);
        border-top: 1px solid var(--border);
        height: 72px;

        .actions > * {
            margin-left: 16px;
        }
    }
}
</style>
