<script setup lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import FleetSecretSelector from '@shell/components/fleet/FleetSecretSelector.vue';
import FleetConfigMapSelector from '@shell/components/fleet/FleetConfigMapSelector.vue';

const props = withDefaults(defineProps<{
  value: Record<string, any>;
  mode: string;
  correctDriftEnabled: boolean;
  downstreamSecretsList: string[];
  downstreamConfigMapsList: string[];
  lockedSecrets?: string[];
  isAppCollection?: boolean;
  compact?: boolean;
}>(), {
  lockedSecrets:   () => [],
  isAppCollection: false,
  compact:         false,
});

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:correct-drift', value: boolean): void;
  (e: 'update:downstream-resources', value: { kind: string; list: string[] }): void;
}>();

const store = useStore();
const { t } = useI18n(store);

const updateCorrectDrift = (value: boolean) => {
  emit('update:correct-drift', value);
};

const updateSecrets = (list: string[]) => {
  const newList = [...list];

  for (const locked of props.lockedSecrets) {
    if (!newList.includes(locked)) {
      newList.push(locked);
    }
  }

  emit('update:downstream-resources', { kind: 'Secret', list: newList });
};

const updateDownstreamResources = (kind: string, list: string[]) => {
  emit('update:downstream-resources', { kind, list });
};
</script>

<template>
  <div data-testid="helmop-resources-section">
    <Banner
      v-if="isAppCollection && lockedSecrets.length > 0"
      color="info"
      :class="['mt-0', compact ? 'mb-16' : 'mb-20']"
      data-testid="helmop-resources-locked-secret-banner"
    >
      {{ t('fleet.helmOp.resources.lockedSecretBanner') }}
    </Banner>
    <div
      class="row"
      :class="compact ? 'mb-16' : 'mt-20 mb-20'"
    >
      <div class="col span-6">
        <FleetSecretSelector
          :value="downstreamSecretsList"
          :namespace="value.metadata.namespace"
          :mode="mode"
          :locked-options="lockedSecrets"
          data-testid="helmop-resources-secret-selector"
          @update:value="updateSecrets"
        />
      </div>
    </div>
    <div
      class="row"
      :class="compact ? 'mt-16 mb-16' : 'mt-20 mb-20'"
    >
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

.mb-16 {
  margin-bottom: 16px;
}

.mt-16 {
  margin-top: 16px;
}
</style>
