<script setup>
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import FleetClusterTargets from '@shell/components/fleet/FleetClusterTargets/index.vue';
import HelmOpTargetOptionsSection from '@shell/components/fleet/HelmOpTargetOptionsSection.vue';

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
  },
  hideAdditionalOptions: {
    type:    Boolean,
    default: false
  },
  compact: {
    type:    Boolean,
    default: false
  },
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
  <div data-testid="helmop-target-tab">
    <div :class="compact ? 'gap-6' : ''">
      <component
        :is="compact && isView || !compact ? 'h2' : 'h4'"
      >
        {{ t('fleet.helmOp.target.label') }}
      </component>
      <FleetClusterTargets
        :targets="value.spec.targets"
        :matching="value.targetClusters"
        :namespace="value.metadata.namespace"
        :mode="realMode"
        :created="targetsCreated"
        :compact="compact"
        data-testid="helmop-target-cluster-targets"
        @update:value="updateTargets"
        @created="onTargetsCreated"
      />
    </div>

    <template v-if="!hideAdditionalOptions">
      <h3 class="mmt-16 mb-20">
        {{ t('fleet.helmOp.target.additionalOptions') }}
      </h3>
      <HelmOpTargetOptionsSection
        :value="value"
        :mode="mode"
        data-testid="helmop-target-options"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.gap-6 {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
