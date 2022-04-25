<script>
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import Banner from '@/components/Banner';
import SecretSelector from '@/components/form/SecretSelector';
import { _CREATE, _VIEW } from '@/config/query-params';

export default {
  components: {
    Banner, Checkbox, LabeledInput, SecretSelector
  },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    namespace: {
      type:     String,
      default:  ''
    }
  },
  data() {
    this.$set(this.value, 'httpConfig', this.value.httpConfig || {});
    this.$set(this.value, 'sendResolved', this.value.sendResolved || false);

    if (this.mode === _CREATE) {
      this.$set(
        this.value,
        'text',
        this.value.text || '{{ template "slack.rancher.text" . }}'
      );
    }

    return { view: _VIEW };
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
      <SecretSelector
        v-if="namespace"
        v-model="value.apiURL"
        :mode="mode"
        :tooltip="t('alertmanagerConfigReceiver.slack.apiUrlTooltip')"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="t('alertmanagerConfigReceiver.slack.keyId')"
        :show-key-selector="true"
      />
      <Banner v-else color="error">
        {{ t('alertmanagerConfigReceiver.namespaceWarning') }}
      </Banner>
      <p class="helper-text text-right mt-10">
        <t k="monitoringReceiver.slack.info" :raw="true" />
      </p>
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
          v-model="value.httpConfig.proxyUrl"
          :mode="mode"
          label="Proxy URL"
          placeholder="e.g. http://my-proxy/"
        />
      </div>
    </div>
    <div class="row">
      <Checkbox
        v-model="value.sendResolved"
        :mode="mode"
        label="Enable send resolved alerts"
      />
    </div>
  </div>
</template>
