<script>
import KeyValue from '@shell/components/form/KeyValue';
import Tab from '@shell/components/Tabbed/Tab';
import Markdown from '@shell/components/Markdown';
import { Banner } from '@components/Banner';

export default {
  components: {
    KeyValue, Tab, Markdown, Banner
  },

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
  data() {
    return {
      example: `
      HTTP_PROXY=http://\${ proxy_host }
      HTTPS_PROXY=http://\${ proxy_host }
      NO_PROXY=127.0.0.0/8,10.0.0.0/8,cattle-system.svc,172.16.0.0/12,192.168.0.0/16`
    };
  }
};
</script>

<template>
  <Tab
    name="agentEnv"
    label-key="cluster.tabs.agentEnv"
  >
    <Banner color="info">
      <div>
        {{ t('cluster.agentEnvVars.tips') }}
        <Markdown :value="example" />
      </div>
    </Banner>
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
