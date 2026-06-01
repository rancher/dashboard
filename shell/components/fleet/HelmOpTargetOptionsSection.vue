<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { RcIcon } from '@components/RcIcon';

withDefaults(defineProps<{
  value: Record<string, any>;
  mode: string;
  compact?: boolean;
}>(), { compact: false });

const store = useStore();
const { t } = useI18n(store);

const DOCS_URL = 'https://fleet.rancher.io/reference/ref-crds#_bundledeploymentoptions';
</script>

<template>
  <div
    :class="{ row: !compact, 'col gap-16': compact }"
    data-testid="helmop-target-options-section"
  >
    <p v-if="compact">
      {{ t('fleet.helmOp.target.clusterDeploymentDescription') }}<br>
      {{ t('generic.learnMoreAbout') }}
      <a
        :href="DOCS_URL"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        {{ t('fleet.helmOp.target.clusterDeploymentLink') }}
        <RcIcon
          type="external-link"
          size="small"
        />
      </a>
    </p>
    <div :class="'col span-6 cluster-deployment-settings-input'">
      <LabeledInput
        v-model:value="value.spec.serviceAccount"
        :mode="mode"
        label-key="fleet.helmOp.serviceAccount.label"
        :placeholder-key="compact ? 'fleet.helmOp.serviceAccount.compactPlaceholder' : 'fleet.helmOp.serviceAccount.placeholder'"
        data-testid="helmop-target-options-service-account"
      />
      <p
        v-if="compact"
        class="sub-description"
      >
        {{ t('fleet.helmOp.serviceAccount.compactDescription') }}
      </p>
    </div>
    <div :class="'col span-6 cluster-deployment-settings-input'">
      <LabeledInput
        v-model:value="value.spec.namespace"
        :mode="mode"
        label-key="fleet.helmOp.targetNamespace.label"
        :placeholder-key="compact ? 'fleet.helmOp.targetNamespace.compactPlaceholder' : 'fleet.helmOp.targetNamespace.placeholder'"
        data-testid="helmop-target-options-namespace"
      />
      <p
        v-if="compact"
        class="sub-description"
      >
        {{ t('fleet.helmOp.targetNamespace.compactDescription') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.gap-16 {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.cluster-deployment-settings-input {
  display: flex;
  gap: 4px;
  flex-direction: column;
}

.sub-description {
  font-size: 12px;
}
</style>
