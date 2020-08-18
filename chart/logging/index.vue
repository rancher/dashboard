<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import Tab from '@/components/Tabbed/Tab';
import { enabledDisabled } from './providers/options';

export default {
  components: { LabeledSelect, Tab },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  hasTabs: true,

  data() {
    const providers = [
      {
        label: 'Elasticsearch',
        value: 'elasticsearch'
      },
      {
        label: 'Kafka',
        value: 'kafka'
      },
      {
        label: 'Splunk',
        value: 'splunk'
      },
      {
        label: 'Syslog',
        value: 'syslog'
      }
    ];

    return {
      enabledDisabledOptions: enabledDisabled(this.t.bind(this)),
      providers
    };
  },

  methods: {
    getProviderComponent(provider) {
      return require(`./providers/${ provider.value }`).default;
    }
  }
};
</script>

<template>
  <div class="logging">
    <Tab v-for="(provider, index) in providers" :key="provider.value" :name="provider.value" :label="provider.label" :weight="index">
      <LabeledSelect v-model="value[provider.value].enabled" :options="enabledDisabledOptions" :label="provider.label" />
      <component :is="getProviderComponent(provider)" v-model="value" />
    </Tab>
  </div>
</template>

<style lang="scss">
.logging {
  width: 60%;
  margin: 0 auto;

  .provider {
      margin-bottom: 20px;
  }
}
</style>
