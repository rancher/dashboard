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
import { Checkbox } from '@components/Form/Checkbox';
import { _CREATE } from '@shell/config/query-params';

export default {
  components: { Checkbox, LabeledInput },
  props:      {
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
    this.value['http_config'] = this.value.http_config || {};
    this.value['send_resolved'] = this.value.send_resolved || false;

    if (this.mode === _CREATE) {
      this.value.text = this.value.text || '{{ template "slack.rancher.text" . }}';
    }

    return {};
  },
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
      <div class="col span-12">
        <LabeledInput
          v-model:value="value.api_url"
          :mode="mode"
          label="Webhook URL"
          placeholder="e.g. https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <p class="helper-text text-right mt-10">
          <t
            k="monitoringReceiver.slack.info"
            :raw="true"
          />
        </p>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.channel"
          :mode="mode"
          label="Default Channel"
          placeholder="e.g. #example"
        />
      </div>
      <div class="col span-6">
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
