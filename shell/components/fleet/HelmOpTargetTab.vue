<script setup>
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import FleetClusterTargets from '@shell/components/fleet/FleetClusterTargets/index.vue';

defineProps({
  value: {
    type:     Object,
    required: true
  },
  mode: {
    type:     String,
    required: true
  },
  realMode: {
    type:     String,
    required: true
  },
  isView: {
    type:    Boolean,
    default: false
  },
  targetsCreated: {
    type:    String,
    default: ''
  }
});

const emit = defineEmits(['update:targets', 'targets-created']);

const store = useStore();
const { t } = useI18n(store);

const updateTargets = (value) => {
  emit('update:targets', value);
};

const onTargetsCreated = (value) => {
  emit('targets-created', value);
};
</script>

<template>
  <div>
    <h2>{{ t('fleet.helmOp.target.label') }}</h2>
    <FleetClusterTargets
      :targets="value.spec.targets"
      :matching="value.targetClusters"
      :namespace="value.metadata.namespace"
      :mode="realMode"
      :created="targetsCreated"
      @update:value="updateTargets"
      @created="onTargetsCreated"
    />

    <h3 class="mmt-16">
      {{ t('fleet.helmOp.target.additionalOptions') }}
    </h3>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.serviceAccount"
          :mode="mode"
          label-key="fleet.helmOp.serviceAccount.label"
          placeholder-key="fleet.helmOp.serviceAccount.placeholder"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.namespace"
          :mode="mode"
          label-key="fleet.helmOp.targetNamespace.label"
          placeholder-key="fleet.helmOp.targetNamespace.placeholder"
          label="Target Namespace"
          placeholder="Optional: Require all resources to be in this namespace"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>
