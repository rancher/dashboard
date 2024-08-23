<script>
/**
 * The Route and Receiver resources are deprecated. Going forward,
 * routes and receivers should be configured within AlertmanagerConfigs.
 * Any updates to receiver configuration forms, such as Slack/email/PagerDuty
 * etc, should be made to the receiver forms that are based on the
 * AlertmanagerConfig resource, which has a different API. The new forms are
 * located in @shell/edit/monitoring.coreos.com.alertmanagerconfig/types.
 */
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';

export default {
  components: {
    Checkbox, LabeledInput, LabeledSelect
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    }
  },
  data() {
    this.value['http_config'] = this.value.http_config || {};
    this.value['send_resolved'] = typeof this.value.send_resolved === 'boolean' ? this.value.send_resolved : true;

    const integrationMapping = {
      'Events API v2': 'routing_key',
      Prometheus:      'service_key'
    };

    const integrationTypeOptions = Object.keys(integrationMapping);

    return {
      integrationMapping,
      integrationTypeOptions,
      integrationType: this.value.service_key ? integrationTypeOptions[1] : integrationTypeOptions[0]
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
        <LabeledSelect
          v-model:value="integrationType"
          :options="integrationTypeOptions"
          :mode="mode"
          label="Integration Type"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value[integrationMapping[integrationType]]"
          :mode="mode"
          label="Default Integration Key"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model:value="value.http_config.proxy_url"
          :mode="mode"
          label="Proxy URL"
          placeholder="e.g. http://my-proxy/"
        />
      </div>
    </div>
    <div class="row">
      <Checkbox
        v-model:value="value.send_resolved"
        :mode="mode"
        label="Enable send resolved alerts"
      />
    </div>
  </div>
</template>
