<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector';
import { _VIEW } from '@shell/config/query-params';

export default {
  components: {
    Checkbox, LabeledInput, LabeledSelect, SimpleSecretSelector
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    },
    namespace: {
      type:    String,
      default: ''
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
      integrationType:             this.value.serviceKey ? integrationTypeOptions[1] : integrationTypeOptions[0],
      initialRoutingKeySecretKey:  this.value.routingKey?.key || '',
      initialRoutingKeySecretName: this.value.routingKey?.name || '',
      initialServiceKeySecretKey:  this.value.serviceKey?.key || '',
      initialServiceKeySecretName: this.value.serviceKey?.name || '',
      view:                        _VIEW,
      none:                        '__[[NONE]]__',
    };
  },
  watch: {
    integrationType() {
      this.integrationTypeOptions.forEach((option) => {
        this.value[this.integrationMapping[option]] = null;
      });
    }
  },
  methods: {
    updateRoutingKeySecretName(name) {
      const existingKey = this.value.routingKey?.key || '';

      if (this.value.routingKey) {
        if (name === this.none) {
          delete this.value.routingKey;
        } else {
          this.value.routingKey = {
            key: existingKey,
            name,
          };
        }
      } else {
        this.value['routingKey'] = {
          key: '',
          name
        };
      }
    },
    updateRoutingKeySecretKey(key) {
      const existingName = this.value.routingKey?.name || '';

      if (this.value.routingKey) {
        this.value.routingKey = {
          name: existingName,
          key
        };
      } else {
        this.value['routingKey'] = {
          name: '',
          key
        };
      }
    },
    updateServiceKeySecretName(name) {
      const existingKey = this.value.serviceKey?.key || '';

      if (this.value.serviceKey) {
        if (name === this.none) {
          delete this.value.serviceKey;
        } else {
          this.value.serviceKey = {
            key: existingKey,
            name,
          };
        }
      } else {
        this.value['serviceKey'] = {
          key: '',
          name
        };
      }
    },
    updateServiceKeySecretKey(key) {
      const existingName = this.value.serviceKey?.name || '';

      if (this.value.serviceKey) {
        this.value.serviceKey = {
          name: existingName,
          key
        };
      } else {
        this.value['serviceKey'] = {
          name: '',
          key
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
    <div
      v-if="namespace"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledSelect
          v-model="integrationType"
          :options="integrationTypeOptions"
          :mode="mode"
          label="Integration Type"
        />
      </div>
    </div>

    <div
      v-if="namespace"
      class="row mb-20"
    >
      <SimpleSecretSelector
        v-if="integrationType === 'Events API v2'"
        :initial-key="initialRoutingKeySecretKey"
        :mode="mode"
        :initial-name="initialRoutingKeySecretName"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="t('monitoring.alertmanagerConfig.pagerDuty.routingKey')"
        @updateSecretName="updateRoutingKeySecretName"
        @updateSecretKey="updateRoutingKeySecretKey"
      />
      <SimpleSecretSelector
        v-if="integrationType === 'Prometheus'"
        :initial-key="initialServiceKeySecretKey"
        :mode="mode"
        :initial-name="initialServiceKeySecretName"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="t('monitoring.alertmanagerConfig.pagerDuty.serviceKey')"
        @updateSecretName="updateServiceKeySecretName"
        @updateSecretKey="updateServiceKeySecretKey"
      />
    </div>
    <Banner
      v-else
      color="error"
    >
      {{ t('alertmanagerConfigReceiver.namespaceWarning') }}
    </Banner>

    <div class="row mb-20">
      <div class="col span-12">
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
