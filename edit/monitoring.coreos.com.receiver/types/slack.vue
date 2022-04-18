<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import { _CREATE } from '@/config/query-params';

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
    deprecatedReceiver: {
      type:     Boolean,
      default:  false
    }
  },
  data(props) {
    if (props.deprecatedReceiver) {
      this.$set(this.value, 'http_config', this.value.http_config || {});
      this.$set(this.value, 'send_resolved', this.value.send_resolved || false);
    } else {
      this.$set(this.value, 'httpConfig', this.value.httpConfig || {});
      this.$set(this.value, 'sendResolved', this.value.sendResolved || false);
    }

    if (this.mode === _CREATE) {
      this.$set(
        this.value,
        'text',
        this.value.text || '{{ template "slack.rancher.text" . }}'
      );
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
          v-if="deprecatedReceiver"
          v-model="value.api_url"
          :mode="mode"
          label="Webhook URL"
          placeholder="e.g. https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <LabeledInput
          v-else
          v-model="value.apiUrl"
          :mode="mode"
          label="Webhook URL"
          placeholder="e.g. https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        />
        <p class="helper-text text-right mt-10">
          <t k="monitoringReceiver.slack.info" :raw="true" />
        </p>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.channel"
          :mode="mode"
          label="Default Channel"
          placeholder="e.g. #example"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-if="deprecatedReceiver"
          v-model="value.http_config.proxy_url"
          :mode="mode"
          label="Proxy URL"
          placeholder="e.g. http://my-proxy/"
        />
        <LabeledInput
          v-else
          v-model="value.httpConfig.proxyUrl"
          :mode="mode"
          label="Proxy URL"
          placeholder="e.g. http://my-proxy/"
        />
      </div>
    </div>
    <div class="row">
      <Checkbox
        v-if="deprecatedReceiver"
        v-model="value.send_resolved"
        :mode="mode"
        label="Enable send resolved alerts"
      />
      <Checkbox
        v-else
        v-model="value.send_resolved"
        :mode="mode"
        label="Enable send resolved alerts"
      />
    </div>
  </div>
</template>
