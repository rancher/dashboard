<script setup lang="ts">
import { ref } from 'vue';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { RcButton } from '@components/RcButton';
import { RcModal } from '@components/RcModal';

const props = withDefaults(defineProps<{
  componentTestid?: string;
  /** `show` and the `close` handler, from whoever owns this dialog's visibility. */
  modal: { show: boolean; onClose:() => void };
  disableCb?:() => void;
}>(), {
  componentTestid: 'disable-local-login',
  disableCb:       () => {},
});

const acknowledged = ref(false);

const disable = (close: () => void) => {
  if (!acknowledged.value) {
    return;
  }

  props.disableCb();
  close();
};
</script>

<template>
  <RcModal
    v-bind="modal"
    :title="t('authConfig.disableLocal.title')"
    :data-testid="componentTestid"
  >
    <div class="disable-local-login-dialog__body">
      <p>{{ t('authConfig.disableLocal.effect') }}</p>
      <p>{{ t('authConfig.disableLocal.recovery') }}</p>

      <Banner
        color="error"
        class="disable-local-login-dialog__warning"
      >
        <p>{{ t('authConfig.disableLocal.soleRoute') }}</p>
        <Checkbox
          v-model:value="acknowledged"
          :label="t('authConfig.disableLocal.acknowledge')"
          :data-testid="componentTestid + '-acknowledge'"
        />
      </Banner>
    </div>

    <template #primary-action="{ close }">
      <RcButton
        variant="primary"
        size="large"
        :disabled="!acknowledged"
        :data-testid="componentTestid + '-confirm-button'"
        @click="disable(close)"
      >
        {{ t('authConfig.disableLocal.confirm') }}
      </RcButton>
    </template>
  </RcModal>
</template>

<style lang='scss' scoped>
  .disable-local-login-dialog {
    &__body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      p {
        margin: 0;
      }
    }

    &__warning {
      width: 100%;
      margin: 0;

      :deep(.banner__content) {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    }
  }
</style>
