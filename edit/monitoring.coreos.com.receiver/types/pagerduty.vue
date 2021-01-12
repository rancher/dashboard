<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
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
    this.$set(this.value, 'http_config', this.value.http_config || {});
    this.$set(this.value, 'send_resolved', typeof this.value.send_resolved === 'boolean' ? this.value.send_resolved : true);

    const integrationMapping = {
      'Events API v2': 'routing_key',
      Prometheus:      'service_key',
    };

    const integrationTypeOptions = Object.keys(integrationMapping);

    return {
      integrationMapping,
      integrationTypeOptions,
      integrationType: this.value.routing_key ? integrationTypeOptions[0] : integrationTypeOptions[1]
    };
  },
  watch: {
    integrationType() {
      this.integrationTypeOptions.forEach((option) => {
        this.value[this.integrationMapping[option]] = null;
      });
    },
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="integrationType"
          :options="integrationTypeOptions"
          :mode="mode"
          :tooltip="{ content: t('monitoringReceiver.pagerduty.info', {}, raw=true), autoHide: false}"
          :hover-tooltip="true"
          label="Integration Type"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value[integrationMapping[integrationType]]"
          :mode="mode"
          label="Default Integration Key"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model="value.http_config.proxy_url"
          :mode="mode"
          label="Proxy URL"
          placeholder="e.g. http://my-proxy/"
        />
      </div>
    </div>
    <div class="row">
      <Checkbox
        v-model="value.send_resolved"
        :mode="mode"
        label="Enable send resolved alerts"
      />
    </div>
  </div>
</template>
