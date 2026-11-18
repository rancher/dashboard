<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { RcButton } from '@components/RcButton';
import { RcModal } from '@components/RcModal';
import { useI18n } from '@shell/composables/useI18n';
import { OPERATION } from '@shell/config/types';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { isOperationInProgress } from '@shell/utils/operation-cr';
import { doneLocationAfterRemove } from '@shell/utils/prompt-remove';

/**
 * Delete prompt for the day 2 operation CRs (see shell/models/day-two-operation.js).
 *
 * Deleting an operation that hasn't finished cancels it, which can leave the cluster in a bad state,
 * so the user has to acknowledge that before Delete is enabled.
 */

const KIND_KEYS: Record<string, string> = {
  [OPERATION.ETCD_SNAPSHOT]:         'promptRemoveOperation.kind.etcdSnapshotSave',
  [OPERATION.ETCD_SNAPSHOT_RESTORE]: 'promptRemoveOperation.kind.etcdSnapshotRestore',
  [OPERATION.ENCRYPTION_KEY_ROTATE]: 'promptRemoveOperation.kind.encryptionKeyRotation',
  [OPERATION.CERTIFICATE_ROTATE]:    'promptRemoveOperation.kind.certificateRotation',
};

const props = defineProps({
  /**
   * `show` and the `close` handler, from whoever owns this dialog's visibility
   */
  modal: {
    type:     Object,
    required: true
  },

  /**
   * The operation to delete
   */
  resources: {
    type:    Array as () => any[],
    default: () => []
  },

  componentTestid: {
    type:    String,
    default: 'remove-operation'
  }
});

const { t } = useI18n(useStore());

const acknowledged = ref(false);
const removing = ref(false);
const errors = ref<string[]>([]);

const resource = computed(() => props.resources[0]);

const attemptingToRemove = computed(() => t('promptRemoveOperation.attemptingToRemove', { kind: t(KIND_KEYS[resource.value?.type]) }));

const showWarning = computed(() => isOperationInProgress(resource.value));

const deleteDisabled = computed(() => removing.value || (showWarning.value && !acknowledged.value));

// Don't let the dialog go away while the delete request is in flight
function close() {
  if (!removing.value) {
    props.modal.onClose();
  }
}

async function remove() {
  if (deleteDisabled.value) {
    return;
  }

  const doneLocation = doneLocationAfterRemove([resource.value]);

  removing.value = true;
  errors.value = [];

  try {
    await resource.value.remove();
  } catch (err) {
    errors.value = exceptionToErrorsArray(err);
    removing.value = false;

    return;
  }

  removing.value = false;

  if (!isEmpty(doneLocation)) {
    resource.value.currentRouter().push(doneLocation);
  }

  close();
}
</script>

<template>
  <RcModal
    :show="modal.show"
    :title="t('promptRemove.title')"
    class="remove-operation"
    :data-testid="componentTestid"
    @close="close"
  >
    <p data-testid="remove-operation-message">
      {{ attemptingToRemove }} <b>{{ resource?.nameDisplay }}</b>.
    </p>

    <Banner
      v-if="showWarning"
      color="warning"
      class="remove-operation__warning"
      :data-testid="componentTestid + '-warning'"
    >
      <div class="remove-operation__warning-content">
        <p>{{ t('promptRemoveOperation.inProgress.warning') }}</p>
        <!-- RcModal would otherwise open on the (focusable) banner -->
        <Checkbox
          v-model:value="acknowledged"
          autofocus
          :label="t('promptRemoveOperation.inProgress.acknowledge')"
          :data-testid="componentTestid + '-acknowledge'"
        />
      </div>
    </Banner>

    <Banner
      v-for="(err, i) in errors"
      :key="i"
      color="error"
      class="remove-operation__error"
      :label="err"
    />

    <template #actions>
      <RcButton
        variant="tertiary"
        size="large"
        :disabled="removing"
        :data-testid="componentTestid + '-cancel-button'"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        size="large"
        class="remove-operation__confirm"
        :disabled="deleteDisabled"
        :data-testid="componentTestid + '-confirm-button'"
        @click="remove"
      >
        {{ t('generic.delete') }}
      </RcButton>
    </template>
  </RcModal>
</template>

<style lang='scss' scoped>
  .remove-operation {
    p {
      margin: 0;
    }

    &__warning, &__error {
      margin: 0;
    }

    &__warning-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    &__confirm.rc-button.variant-primary:not(:disabled) {
      background-color: var(--error);
      color: var(--error-text);

      &:hover, &:focus {
        background-color: var(--error-hover-bg);
        color: var(--error-hover-text);
      }
    }
  }
</style>
