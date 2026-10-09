<script lang="ts">
import { defineComponent } from 'vue';
import InfoBox from '@shell/components/InfoBox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import { _VIEW } from '@shell/config/query-params';

export const IO_THREADS_POLICIES = ['', 'shared', 'auto', 'supplementalPool'];
export const DEFAULT_IO_THREAD_COUNT = '2';

export default defineComponent({
  name: 'VmStorageOptions',

  components: {
    InfoBox, LabeledSelect, LabeledInput, Checkbox, Banner
  },

  emits: ['update:blockMultiQueue', 'update:ioThreadsPolicy', 'update:ioThreadCount'],

  props: {
    blockMultiQueue: {
      type:    Boolean,
      default: false
    },

    ioThreadsPolicy: {
      type:    String,
      default: ''
    },

    // Int driver flags are strings in the machine config
    ioThreadCount: {
      type:    String,
      default: ''
    },

    // Whether any disk asks for a dedicated I/O thread, in which case the driver turns on the shared policy
    hasDedicatedIoThread: {
      type:    Boolean,
      default: false
    },

    mode: {
      type:    String,
      default: 'create'
    },

    disabled: {
      type:    Boolean,
      default: false
    },
  },

  data() {
    return { expanded: !!(this.blockMultiQueue || this.ioThreadsPolicy) };
  },

  computed: {
    isView(): boolean {
      return this.mode === _VIEW;
    },

    ioThreadsPolicyOptions(): { label: string, value: string }[] {
      return IO_THREADS_POLICIES.map((value) => ({
        label: this.t(`cluster.credential.harvester.vmStorageOptions.ioThreadsPolicy.${ value || 'default' }`),
        value,
      }));
    },
  },

  methods: {
    setIoThreadsPolicy(policy: string) {
      this.$emit('update:ioThreadsPolicy', policy);

      // The driver only accepts a thread count with the supplemental pool policy
      if (policy === 'supplementalPool') {
        if (!this.ioThreadCount) {
          this.$emit('update:ioThreadCount', DEFAULT_IO_THREAD_COUNT);
        }
      } else if (this.ioThreadCount) {
        this.$emit('update:ioThreadCount', '');
      }
    },
  },
});
</script>

<template>
  <InfoBox
    v-if="!isView || expanded"
    class="vm-storage-options mb-10"
  >
    <button
      v-if="!isView"
      type="button"
      class="btn btn-sm role-link expand-toggle"
      data-testid="vm-storage-options-toggle"
      :aria-expanded="expanded"
      @click.prevent="expanded = !expanded"
    >
      <i
        class="icon"
        :class="expanded ? 'icon-chevron-down' : 'icon-chevron-right'"
      />
      {{ t('cluster.credential.harvester.vmStorageOptions.title') }}
    </button>
    <h4 v-else>
      {{ t('cluster.credential.harvester.vmStorageOptions.title') }}
    </h4>

    <template v-if="expanded">
      <p class="text-muted mt-10 mb-10">
        {{ t('cluster.credential.harvester.vmStorageOptions.description') }}
      </p>

      <Checkbox
        :value="blockMultiQueue"
        data-testid="vm-storage-options-block-multi-queue"
        class="mb-10"
        :label="t('cluster.credential.harvester.vmStorageOptions.blockMultiQueue.label')"
        :tooltip="t('cluster.credential.harvester.vmStorageOptions.blockMultiQueue.tip')"
        :mode="mode"
        :disabled="disabled"
        @update:value="$emit('update:blockMultiQueue', $event)"
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
            type="number"
            min="1"
            :required="true"
            :label="t('cluster.credential.harvester.vmStorageOptions.ioThreadCount.label')"
            :tooltip="t('cluster.credential.harvester.vmStorageOptions.ioThreadCount.tip')"
            :mode="mode"
            :disabled="disabled"
            @update:value="$emit('update:ioThreadCount', String($event))"
          />
        </div>
      </div>

      <Banner
        v-if="hasDedicatedIoThread && !ioThreadsPolicy"
        color="info"
        :label="t('cluster.credential.harvester.vmStorageOptions.ioThreadsPolicy.sharedTip')"
      />
    </template>
  </InfoBox>
</template>

<style lang="scss" scoped>
.vm-storage-options {
  .expand-toggle {
    padding: 0;
    font-weight: 600;

    .icon {
      margin-right: 4px;
    }
  }
}
</style>
