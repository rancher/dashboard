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
    namespace: {
      type:     String,
      default:  ''
    }
  },
  data() {
    this.$set(this.value, 'httpConfig', this.value.httpConfig || {});
    this.$set(this.value, 'sendResolved', typeof this.value.send_resolved === 'boolean' ? this.value.send_resolved : true);

    const integrationMapping = {
      'Events API v2': 'routingKey',
      Prometheus:      'serviceKey'
    };

    const integrationTypeOptions = Object.keys(integrationMapping);

    return {
      integrationMapping,
      integrationTypeOptions,
      integrationType: this.value.serviceKey ? integrationTypeOptions[1] : integrationTypeOptions[0]
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
    <div v-if="namespace" class="row mb-20">
      <div class="col span-6">
        <LabeledSelect v-model="integrationType" :options="integrationTypeOptions" :mode="mode" label="Integration Type" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value[integrationMapping[integrationType]]" :mode="mode" label="Default Integration Key" />
      </div>
    </div>
    <Banner v-else color="error">
      {{ t('alertmanagerConfigReceiver.namespaceWarning') }}
    </Banner>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput v-model="value.httpConfig.proxyUrl" :mode="mode" label="Proxy URL" placeholder="e.g. http://my-proxy/" />
      </div>
    </div>
    <div class="row">
      <Checkbox v-model="value.sendResolved" :mode="mode" label="Enable send resolved alerts" />
    </div>
  </div>
</template>
