<script setup lang="ts">
import { ref } from 'vue';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import { RcButton } from '@components/RcButton';

const props = withDefaults(defineProps<{
  componentTestid?: string;
  name?: string;
  canRestore?: boolean;
  restoreCb?:() => Promise<void>;
}>(), {
  componentTestid: 'disable-last-auth-provider',
  name:            '',
  canRestore:      true,
  restoreCb:       () => Promise.resolve(),
});

const emit = defineEmits<{(e: 'close'): void }>();

const saving = ref(false);
const error = ref<string | null>(null);

const close = () => emit('close');

const restore = async() => {
  if (saving.value) {
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await props.restoreCb();
    emit('close');
  } catch (e: any) {
    error.value = e?.message || `${ e }`;
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <Card
    class="disable-last-auth-provider"
    :show-highlight-border="false"
  >
    <template #title>
      <h3 class="disable-last-auth-provider__title">
        {{ name ? t('authConfig.disableLast.title', { name }) : t('authConfig.disableLast.titleGeneric') }}
      </h3>
    </template>
    <template #body>
      <div class="disable-last-auth-provider__body">
        <p class="disable-last-auth-provider__copy">
          {{ t('authConfig.disableLast.soleProvider', { name }) }}
        </p>
        <p class="disable-last-auth-provider__copy">
          {{ t('authConfig.disableLast.remedy') }}
        </p>
        <p class="disable-last-auth-provider__copy">
          {{ t('authConfig.disableLast.refusal') }}
        </p>

        <Banner
          v-if="!canRestore"
          color="warning"
          class="disable-last-auth-provider__locked"
          :data-testid="componentTestid + '-locked'"
          :label="t('authConfig.disableLast.locked')"
        />

        <Banner
          v-if="error"
          color="error"
          role="alert"
          class="disable-last-auth-provider__error"
          :data-testid="componentTestid + '-error'"
          :label="error"
        />
      </div>
    </template>
    <template #actions>
      <div class="disable-last-auth-provider__actions">
        <RcButton
          variant="link"
          size="large"
          class="disable-last-auth-provider__cancel"
          :data-testid="componentTestid + '-cancel-button'"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </RcButton>
        <RcButton
          v-if="canRestore"
          variant="primary"
          size="large"
          class="disable-last-auth-provider__confirm"
          :disabled="saving"
          :data-testid="componentTestid + '-confirm-button'"
          @click="restore"
        >
          {{ t('authConfig.disableLast.confirm') }}
        </RcButton>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
  .disable-last-auth-provider {
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
    }

    &__copy {
      margin: 0;
      line-height: 22px;
      color: var(--label-secondary);
    }

    &__locked,
    &__error {
      width: 100%;
      margin: 0;
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
