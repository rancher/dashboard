<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector';
import { _CREATE, _VIEW } from '@shell/config/query-params';

export default {
  components: {
    Banner, Checkbox, LabeledInput, SimpleSecretSelector
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

    return {
      view:              _VIEW,
      initialSecretKey:  this.value?.apiURL?.key ? this.value.apiURL.key : '',
      initialSecretName: this.value.apiURL?.name ? this.value.apiURL.name : '',
      none:              '__[[NONE]]__',
    };
  },

  methods: {
    updateSecretName(name) {
      const existingKey = this.value.apiURL?.key || '';

      if (this.value.apiURL) {
        if (name === this.none) {
          delete this.value.apiURL;
        } else {
          this.value.apiURL = {
            key: existingKey,
            name,
          };
        }
      } else {
        this.value['apiURL'] = {
          key: '',
          name
        };
      }
    },
    updateSecretKey(key) {
      const existingName = this.value.apiURL?.name || '';

      if (this.value.apiURL) {
        this.value.apiURL = {
          key,
          name: existingName
        };
      } else {
        this.value['apiURL'] = {
          key,
          name: ''
        };
      }
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
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialSecretKey"
        :mode="mode"
        :initial-name="initialSecretName"
        :tooltip="t('alertmanagerConfigReceiver.slack.apiUrlTooltip')"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="t('monitoring.alertmanagerConfig.slack.apiUrl')"
        @updateSecretName="updateSecretName"
        @updateSecretKey="updateSecretKey"
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
