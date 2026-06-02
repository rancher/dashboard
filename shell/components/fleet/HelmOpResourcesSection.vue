<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@shell/composables/useI18n';
import { useHelmOpResources } from '@shell/composables/useHelmOpResources';
import { useStore } from 'vuex';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FleetSecretSelector from '@shell/components/fleet/FleetSecretSelector.vue';
import FleetConfigMapSelector from '@shell/components/fleet/FleetConfigMapSelector.vue';

defineProps<{
  value: Record<string, any>;
  mode: string;
  correctDriftEnabled: boolean;
  downstreamSecretsList: string[];
  downstreamConfigMapsList: string[];
}>();

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:correct-drift', value: boolean): void;
  (e: 'update:downstream-resources', value: { kind: string; list: string[] }): void;
}>();

const store = useStore();
const { t } = useI18n(store);

const { updateCorrectDrift, updateSecrets, updateDownstreamResources } = useHelmOpResources(emit, ref([]));
</script>

<template>
  <div data-testid="helmop-resources-section">
    <div class="row mt-20 mb-20">
      <div class="col span-6">
        <FleetSecretSelector
          :value="downstreamSecretsList"
          :namespace="value.metadata.namespace"
          :mode="mode"
          data-testid="helmop-resources-secret-selector"
          @update:value="updateSecrets"
        />
      </div>
    </div>
    <div class="row mt-20 mb-20">
      <div class="col span-6">
        <FleetConfigMapSelector
          :value="downstreamConfigMapsList"
          :namespace="value.metadata.namespace"
          :mode="mode"
          data-testid="helmop-resources-configmap-selector"
          @update:value="updateDownstreamResources('ConfigMap', $event)"
        />
      </div>
    </div>
    <div class="resource-handling">
      <Checkbox
        :value="correctDriftEnabled"
        :tooltip="t('fleet.helmOp.resources.correctDriftTooltip')"
        type="checkbox"
        label-key="fleet.helmOp.resources.correctDrift"
        :mode="mode"
        data-testid="helmop-resources-correct-drift"
        @update:value="updateCorrectDrift"
      />
      <Checkbox
        v-model:value="value.spec.keepResources"
        :tooltip="t('fleet.helmOp.resources.keepResourcesTooltip')"
        type="checkbox"
        label-key="fleet.helmOp.resources.keepResources"
        :mode="mode"
        data-testid="helmop-resources-keep-resources"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.resource-handling {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>
