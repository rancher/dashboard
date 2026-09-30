<script setup lang="ts">
/**
 * The question useConfirm asks, laid out like the product's other AppModal dialogs: a heading, the
 * question, then Cancel as a link and the action named for what it does
 */
import { useStore } from 'vuex';
import AppModal from '@shell/components/AppModal.vue';
import { RcButton } from '@components/RcButton';
import { RcHeading } from '@components/RcHeading';
import { useI18n } from '@shell/composables/useI18n';
import { pendingConfirm, settleConfirm } from '../composables/useConfirm';

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <app-modal
    v-if="pendingConfirm"
    name="configurableViewsConfirm"
    :width="560"
    :trigger-focus-trap="true"
    @close="settleConfirm(false)"
  >
    <div
      class="confirm-modal"
      data-testid="configurable-views-confirm"
    >
      <div class="confirm-content">
        <RcHeading
          :size="3"
          class="confirm-title"
          data-modal-title
        >
          {{ pendingConfirm.title }}
        </RcHeading>
        <p class="confirm-body">
          {{ pendingConfirm.body }}
        </p>
      </div>
      <div class="confirm-actions">
        <RcButton
          variant="link"
          size="large"
          data-testid="configurable-views-confirm-cancel"
          @click="settleConfirm(false)"
        >
          {{ t('generic.cancel') }}
        </RcButton>
        <RcButton
          variant="primary"
          size="large"
          :class="{ 'confirm-danger': pendingConfirm.danger }"
          data-testid="configurable-views-confirm-action"
          @click="settleConfirm(true)"
        >
          {{ pendingConfirm.action }}
        </RcButton>
      </div>
    </div>
  </app-modal>
</template>

<style lang="scss" scoped>
.confirm-modal {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 24px;

  .confirm-title {
    margin: 0 0 16px 0;
    font-weight: 600;
  }

  .confirm-body {
    margin: 0;
    line-height: 20px;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
  }

  .confirm-danger {
    background: var(--error);
    border-color: var(--error);
    color: var(--error-text, #fff);
  }
}
</style>
