<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import { _CREATE } from '@shell/config/query-params';
import { IO_THREADS_POLICIES, DEFAULT_IO_THREAD_COUNT, UNSET_IO_THREAD_COUNT } from './storage-options';

const props = withDefaults(defineProps<{
  blockMultiQueue?: boolean;
  ioThreadsPolicy?: string;
  // Int driver flags are strings in the machine config, and the schema defaults this one to "0"
  ioThreadCount?: string;
  // Whether any disk asks for a dedicated I/O thread, in which case the driver turns on the shared policy
  hasDedicatedIoThread?: boolean;
  mode?: string;
  disabled?: boolean;
}>(), {
  blockMultiQueue:      false,
  ioThreadsPolicy:      '',
  ioThreadCount:        '',
  hasDedicatedIoThread: false,
  mode:                 _CREATE,
  disabled:             false,
});

const emit = defineEmits<{(e: 'update:blockMultiQueue', value: boolean): void;
  (e: 'update:ioThreadsPolicy', value: string): void;
  (e: 'update:ioThreadCount', value: string): void;
}>();

const store = useStore();
const { t } = useI18n(store);

const ioThreadsPolicyOptions = computed(() => IO_THREADS_POLICIES.map((value) => ({
  label: t(`cluster.credential.harvester.vmStorageOptions.ioThreadsPolicy.${ value || 'default' }`),
  value,
})));

function setIoThreadsPolicy(policy: string) {
  emit('update:ioThreadsPolicy', policy);

  // The driver only accepts a thread count with the supplemental pool policy
  if (policy === 'supplementalPool') {
    if (!(Number(props.ioThreadCount) >= 1)) {
      emit('update:ioThreadCount', DEFAULT_IO_THREAD_COUNT);
    }
  } else if (Number(props.ioThreadCount)) {
    // Back to the schema default rather than empty: Rancher hashes "" and "0" differently, so a pool that ends
    // up where it started would otherwise roll out its machines
    emit('update:ioThreadCount', UNSET_IO_THREAD_COUNT);
  }
}
</script>

<template>
  <div>
    <Checkbox
      :value="blockMultiQueue"
      data-testid="vm-storage-options-block-multi-queue"
      class="mb-10"
      :label="t('cluster.credential.harvester.vmStorageOptions.blockMultiQueue.label')"
      :tooltip="t('cluster.credential.harvester.vmStorageOptions.blockMultiQueue.tip')"
      :mode="mode"
      :disabled="disabled"
      @update:value="emit('update:blockMultiQueue', $event)"
    />

    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          :value="ioThreadsPolicy"
          data-testid="vm-storage-options-io-threads-policy"
          :label="t('cluster.credential.harvester.vmStorageOptions.ioThreadsPolicy.label')"
          :tooltip="t('cluster.credential.harvester.vmStorageOptions.ioThreadsPolicy.tip')"
          :options="ioThreadsPolicyOptions"
          :mode="mode"
          :disabled="disabled"
          @update:value="setIoThreadsPolicy"
        />
      </div>
      <div
        v-if="ioThreadsPolicy === 'supplementalPool'"
        class="col span-6"
      >
        <LabeledInput
          :value="ioThreadCount"
          data-testid="vm-storage-options-io-thread-count"
          type="integer"
          min="1"
          :required="true"
          :label="t('cluster.credential.harvester.vmStorageOptions.ioThreadCount.label')"
          :tooltip="t('cluster.credential.harvester.vmStorageOptions.ioThreadCount.tip')"
          :mode="mode"
          :disabled="disabled"
          @update:value="emit('update:ioThreadCount', String($event))"
        />
      </div>
    </div>

    <Banner
      v-if="hasDedicatedIoThread && !ioThreadsPolicy"
      color="info"
      :label="t('cluster.credential.harvester.vmStorageOptions.ioThreadsPolicy.sharedTip')"
    />
  </div>
</template>
