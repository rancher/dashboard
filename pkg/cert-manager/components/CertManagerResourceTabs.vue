<script setup lang="ts">
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Conditions from '@shell/components/form/Conditions.vue';

/**
 * ResourceTabs decides the Conditions tab's alert icon from `status.conditions[].error`, which
 * Steve only populates for resource types it knows. Ours arrive unclassified, so the tab is
 * supplied here instead and driven by the model's own condition judgement.
 */
defineProps<{ value: any }>();
</script>

<template>
  <ResourceTabs
    :value="value"
    :need-conditions="false"
  >
    <slot />
    <Tab
      v-if="value.status?.conditions?.length"
      name="conditions"
      label-key="resourceTabs.conditions.tab"
      :weight="-1"
      :display-alert-icon="value.conditionsHaveIssues"
    >
      <Conditions :value="value" />
    </Tab>
  </ResourceTabs>
</template>
