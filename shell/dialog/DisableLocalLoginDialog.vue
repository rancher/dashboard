<script setup lang="ts">
import { ref } from 'vue';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { RcButton } from '@components/RcButton';

const props = defineProps({
  componentTestid: {
    type:    String,
    default: 'disable-local-login'
  },

  disableCb: {
    type:    Function,
    default: () => {}
  }
});

const emit = defineEmits<{(e: 'close'): void }>();

const acknowledged = ref(false);

const close = () => emit('close');

const disable = () => {
  if (!acknowledged.value) {
    return;
  }

  props.disableCb();
  emit('close');
};
</script>

<template>
  <Card
    class="disable-local-login-dialog"
    :show-highlight-border="false"
  >
    <template #title>
      <h3 class="disable-local-login-dialog__title">
        {{ t('authConfig.disableLocal.title') }}
      </h3>
    </template>
    <template #body>
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
    </template>
    <template #actions>
      <div class="disable-local-login-dialog__actions">
        <RcButton
          variant="link"
          size="large"
          class="disable-local-login-dialog__cancel"
          :data-testid="componentTestid + '-cancel-button'"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </RcButton>
        <RcButton
          variant="primary"
          size="large"
          :disabled="!acknowledged"
          :data-testid="componentTestid + '-confirm-button'"
          @click="disable"
        >
          {{ t('authConfig.disableLocal.confirm') }}
        </RcButton>
      </div>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .disable-local-login-dialog {
    &.card-container {
      box-shadow: none;
      margin: 0;
      padding: 24px;
    }

    :deep(.card-wrap > hr) {
      display: none;
    }

    :deep(.card-body) {
      margin-top: 16px;
      color: var(--body-text);
    }

    :deep(.card-actions) {
      padding-top: 40px;
    }

    &__title {
      margin: 0;
      font-size: 18px;
      line-height: 23px;
      font-weight: 700;
      color: var(--body-text);
    }

    &__body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      p {
        margin: 0;
        line-height: 22px;
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

    &__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 16px;
      width: 100%;
    }

    &__cancel.rc-button {
      --rc-button-padding: 0 12px;
    }
  }
</style>
