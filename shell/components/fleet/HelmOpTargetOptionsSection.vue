<script setup lang="ts">
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

withDefaults(defineProps<{
  value: Record<string, any>;
  mode: string;
  stacked?: boolean;
}>(), { stacked: false });
</script>

<template>
  <div
    :class="{ row: !stacked, 'col gap-16': stacked }"
    data-testid="helmop-target-options-section"
  >
    <div class="col span-6">
      <LabeledInput
        v-model:value="value.spec.serviceAccount"
        :mode="mode"
        label-key="fleet.helmOp.serviceAccount.label"
        placeholder-key="fleet.helmOp.serviceAccount.placeholder"
        data-testid="helmop-target-options-service-account"
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
        data-testid="helmop-target-options-namespace"
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
.gap-16 {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
