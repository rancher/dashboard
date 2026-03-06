<script setup>
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { LabeledInput } from '@components/Form/LabeledInput';
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
  targetsCreated: {
    type:    String,
    default: ''
  }
});

const emit = defineEmits(['update:targets', 'created']);

const store = useStore();
const { t } = useI18n(store);

const updateTargets = (value) => {
  emit('update:targets', value);
};

const onCreated = (value) => {
  emit('created', value);
};
</script>

<template>
  <div>
    <h2>{{ t('fleet.gitRepo.target.label') }}</h2>
    <FleetClusterTargets
      :targets="value.spec.targets"
      :matching="value.targetClusters"
      :namespace="value.metadata.namespace"
      :mode="realMode"
      :created="targetsCreated"
      @update:value="updateTargets"
      @created="onCreated"
    />

    <h3 class="mmt-16">
      {{ t('fleet.gitRepo.target.additionalOptions') }}
    </h3>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.serviceAccount"
          :mode="mode"
          label-key="fleet.gitRepo.serviceAccount.label"
          placeholder-key="fleet.gitRepo.serviceAccount.placeholder"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.targetNamespace"
          :mode="mode"
          label-key="fleet.gitRepo.targetNamespace.label"
          placeholder-key="fleet.gitRepo.targetNamespace.placeholder"
          label="Target Namespace"
          placeholder="Optional: Require all resources to be in this namespace"
        />
      </div>
    </div>
  </div>
</template>
