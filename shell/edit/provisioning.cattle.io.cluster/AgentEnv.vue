<script>
import KeyValue from '@shell/components/form/KeyValue';
import Tab from '@shell/components/Tabbed/Tab';

export default {
  components: { KeyValue, Tab },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
  },
};
</script>

<template>
  <Tab
    name="agentEnv"
    label-key="cluster.tabs.agentEnv"
  >
    <KeyValue
      v-model="value.spec.agentEnvVars"
      :mode="mode"
      key-name="name"
      :as-map="false"
      :preserve-keys="['valueFrom']"
      :supported="(row) => typeof row.valueFrom === 'undefined'"
      :read-allowed="true"
      :value-can-be-empty="true"
      :key-label="t('cluster.agentEnvVars.keyLabel')"
      :parse-lines-from-file="true"
    />
  </Tab>
</template>
