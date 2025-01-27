<script>
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { mapGetters } from 'vuex';

export default {
  components: { LabeledInput, Checkbox },
  emits:      ['worker-concurrency-changed', 'server-concurrency-changed', 'drain-worker-nodes-changed', 'drain-server-nodes-changed'],
  props:      {
    value: {
      type:    Object,
      default: () => ({ }),
    },
    mode: {
      type:     String,
      required: true,
    },
    isWorker: {
      type:    Boolean,
      default: true
    },
    rules: {
      default: () => ({ concurrency: [] }),
      type:    Object,
    },
    disabled: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { enabled: false };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    concurrency() {
      return this.isWorker ? this.value?.workerConcurrency : this.value?.serverConcurrency;
    },
    drainNodes() {
      return this.isWorker ? this.value?.drainWorkerNodes : this.value?.drainServerNodes;
    }
  }
};
</script>

<template>
  <div>
    <LabeledInput
      :value="concurrency"
      :mode="mode"
      :label="isWorker ? t('cluster.rke2.workerConcurrency.label') : t('cluster.rke2.controlPlaneConcurrency.label')"
      :rules="rules.concurrency"
      required
      class="mb-10"
      :disabled="disabled"
      @update:value="isWorker ? $emit('worker-concurrency-changed', $event) : $emit('server-concurrency-changed', $event);"
    />
    <Checkbox
      :value="drainNodes"
      :mode="mode"
      :disabled="disabled"
      :label="isWorker ? t('imported.drainWorkerNodes.label') : t('imported.drainControlPlaneNodes.label')"
      @update:value="isWorker ? $emit('drain-worker-nodes-changed', $event) : $emit('drain-server-nodes-changed', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
  $drain-timeout-index: 18px;

  .drain-timeout {
    margin-top: 5px;
    margin-left: $drain-timeout-index;
    width: calc(100% - $drain-timeout-index);
  }
</style>
