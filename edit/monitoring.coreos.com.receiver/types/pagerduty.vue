<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: {
    Checkbox, LabeledInput, LabeledSelect
  },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    },
    deprecatedReceiver: {
      type:    Boolean,
      default: false
    }
  },
  data(props) {
    let integrationMapping;
    let integrationTypeOptions;
    let integrationType;

    if (props.deprecatedReceiver) {
      this.$set(this.value, 'http_config', this.value.http_config || {});
      this.$set(this.value, 'send_resolved', typeof this.value.send_resolved === 'boolean' ? this.value.send_resolved : true);

      integrationMapping = {
        'Events API v2': 'routing_key',
        Prometheus:      'service_key'
      };

      integrationTypeOptions = Object.keys(integrationMapping);

      integrationType = this.value.service_key ? integrationTypeOptions[1] : integrationTypeOptions[0];
    } else {
      this.$set(this.value, 'httpConfig', this.value.httpConfig || {});
      this.$set(this.value, 'sendResolved', typeof this.value.sendResolved === 'boolean' ? this.value.sendResolved : true);

      integrationMapping = {
        'Events API v2': 'routingKey',
        Prometheus:      'serviceKey'
      };
      integrationTypeOptions = Object.keys(integrationMapping);

      integrationType = this.value.serviceKey ? integrationTypeOptions[1] : integrationTypeOptions[0];
    }

    return {
      integrationMapping,
      integrationTypeOptions,
      integrationType
    };
  },
  watch: {
    integrationType() {
      this.integrationTypeOptions.forEach((option) => {
        this.value[this.integrationMapping[option]] = null;
      });
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <h3>Target</h3>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect v-model="integrationType" :options="integrationTypeOptions" :mode="mode" label="Integration Type" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value[integrationMapping[integrationType]]" :mode="mode" label="Default Integration Key" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput v-if="deprecatedReceiver" v-model="value.http_config.proxy_url" :mode="mode" label="Proxy URL" placeholder="e.g. http://my-proxy/" />
        <LabeledInput v-else v-model="value.httpConfig.proxyUrl" :mode="mode" label="Proxy URL" placeholder="e.g. http://my-proxy/" />
      </div>
    </div>
    <div class="row">
      <Checkbox v-if="deprecatedReceiver" v-model="value.send_resolved" :mode="mode" label="Enable send resolved alerts" />
      <Checkbox v-else v-model="value.sendResolved" :mode="mode" label="Enable send resolved alerts" />
    </div>
  </div>
</template>
