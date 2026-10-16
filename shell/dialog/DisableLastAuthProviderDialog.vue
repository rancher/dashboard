<script setup lang="ts">
import { ref } from 'vue';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { RcModal } from '@components/RcModal';

const props = withDefaults(defineProps<{
  componentTestid?: string;
  /** `show` and the `close` handler, from whoever owns this dialog's visibility. */
  modal: { show: boolean; onClose:() => void };
  name?: string;
  canRestore?: boolean;
  restoreCb?:() => Promise<void>;
}>(), {
  componentTestid: 'disable-last-auth-provider',
  name:            '',
  canRestore:      true,
  restoreCb:       () => Promise.resolve(),
});

const saving = ref(false);
const error = ref<string | null>(null);

const restore = async() => {
  if (saving.value) {
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await props.restoreCb();
    props.modal.onClose();
  } catch (e: any) {
    error.value = e?.message || `${ e }`;
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <RcModal
    v-bind="modal"
    :title="name ? t('authConfig.disableLast.title', { name }) : t('authConfig.disableLast.titleGeneric')"
    :data-testid="componentTestid"
  >
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

    <template #actions="{ cancel }">
      <RcButton
        variant="tertiary"
        size="large"
        :data-testid="componentTestid + '-cancel-button'"
        @click="cancel"
      >
        {{ t('generic.cancel') }}
      </RcButton>
      <RcButton
        v-if="canRestore"
        variant="primary"
        size="large"
        :disabled="saving"
        :data-testid="componentTestid + '-confirm-button'"
        @click="restore"
      >
        {{ t('authConfig.disableLast.confirm') }}
      </RcButton>
    </template>
  </RcModal>
</template>

<style lang="scss" scoped>
  .disable-last-auth-provider {
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
  }
</style>
