<script setup lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { RcSection } from '@components/RcSection';
import FleetSecretSelector from '@shell/components/fleet/FleetSecretSelector.vue';
import FleetConfigMapSelector from '@shell/components/fleet/FleetConfigMapSelector.vue';
import { RcIcon } from '@components/RcIcon';

const props = withDefaults(defineProps<{
  value: Record<string, any>;
  mode: string;
  correctDriftEnabled: boolean;
  downstreamSecretsList: string[];
  downstreamConfigMapsList: string[];
  lockedSecrets?: string[];
}>(), { lockedSecrets: () => [] });

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:correct-drift', value: boolean): void;
  (e: 'update:downstream-resources', value: { kind: string; list: string[] }): void;
}>();

const store = useStore();
const { t } = useI18n(store);

const DOCS_URL = 'https://fleet.rancher.io/experimental-features/experimental-downstream-resource';

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
  <div
    class="gap-16"
    data-testid="helmop-appco-resources-section"
  >
    <!-- Helm chart resources settings -->
    <RcSection
      :title="t('fleet.helmOp.appCoResources.helmChartSettings')"
      mode="with-header"
      type="secondary"
      expandable
      :expanded="true"
      data-testid="helmop-appco-resources-chart-settings"
    >
      <div class="resource-handling">
        <Checkbox
          :value="correctDriftEnabled"
          :tooltip="t('fleet.helmOp.resources.correctDriftTooltip')"
          type="checkbox"
          label-key="fleet.helmOp.resources.correctDrift"
          :use-body-text-color="true"
          :mode="mode"
          data-testid="helmop-appco-resources-correct-drift"
          @update:value="updateCorrectDrift"
        />
        <Checkbox
          v-model:value="value.spec.keepResources"
          :tooltip="t('fleet.helmOp.resources.keepResourcesTooltip')"
          type="checkbox"
          label-key="fleet.helmOp.resources.keepResources"
          :use-body-text-color="true"
          :mode="mode"
          data-testid="helmop-appco-resources-keep-resources"
        />
      </div>
    </RcSection>

    <!-- Additional resources to sync -->
    <RcSection
      :title="t('fleet.helmOp.appCoResources.additionalResources')"
      mode="with-header"
      type="secondary"
      expandable
      :expanded="true"
      data-testid="helmop-appco-resources-additional"
    >
      <div class="gap-16">
        <p>
          {{ t('fleet.helmOp.appCoResources.additionalResourcesDescription') }}<br>
          {{ t('fleet.helmOp.appCoResources.additionalResourcesLinkDescription') }}
          <a
            :href="DOCS_URL"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            {{ t('fleet.helmOp.appCoResources.additionalResourcesLink') }}
            <RcIcon
              type="external-link"
              size="small"
            /></a>
        </p>

        <div class="gap-12">
          <Banner
            v-if="lockedSecrets.length > 0"
            color="info"
            :class="'mb-0 mt-0'"
            data-testid="helmop-appco-resources-locked-secret-banner"
          >
            {{ t('fleet.helmOp.resources.lockedSecretBanner') }}
          </Banner>

          <div
            class="row"
          >
            <div class="col span-6">
              <FleetSecretSelector
                :value="downstreamSecretsList"
                :namespace="value.metadata.namespace"
                :mode="mode"
                :locked-options="lockedSecrets"
                data-testid="helmop-appco-resources-secret-selector"
                @update:value="updateSecrets"
              />
            </div>
          </div>
        </div>
        <div
          class="row"
        >
          <div class="col span-6">
            <FleetConfigMapSelector
              :value="downstreamConfigMapsList"
              :namespace="value.metadata.namespace"
              :mode="mode"
              data-testid="helmop-appco-resources-configmap-selector"
              @update:value="updateDownstreamResources('ConfigMap', $event)"
            />
          </div>
        </div>
      </div>
    </RcSection>
  </div>
</template>

<style lang="scss" scoped>
.resource-handling {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.gap-12 {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gap-16 {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
