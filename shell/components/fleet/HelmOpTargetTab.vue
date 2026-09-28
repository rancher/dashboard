<script setup lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import FleetClusterTargets from '@shell/components/fleet/FleetClusterTargets/index.vue';
import HelmOpTargetOptionsSection from '@shell/components/fleet/HelmOpTargetOptionsSection.vue';

import type { Target } from '@shell/types/fleet';

interface HelmOpValue {
  spec: {
    targets: Target[];
    serviceAccount?: string;
    namespace?: string;
  };
  metadata: { namespace: string };
  targetClusters: object[];
}

withDefaults(defineProps<{
  value: HelmOpValue;
  mode: string;
  realMode: string;
  targetsCreated?: string;
  hideAdditionalOptions?: boolean;
  compact?: boolean;
}>(), {
  targetsCreated:        '',
  hideAdditionalOptions: false,
  compact:               false,
});

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:targets', value: Target[]): void;
  (e: 'targets-created', value: string): void;
}>();

const store = useStore();
const { t } = useI18n(store);

const updateTargets = (value: Target[]) => {
  emit('update:targets', value);
};

const onTargetsCreated = (value: string) => {
  emit('targets-created', value);
};
</script>

<template>
  <div data-testid="helmop-target-tab">
    <div :class="{ 'gap-6': compact }">
      <h2 v-if="!compact || realMode === 'view'">
        {{ t('fleet.helmOp.target.label') }}
      </h2>
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
