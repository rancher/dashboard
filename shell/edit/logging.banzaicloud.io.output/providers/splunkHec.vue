<script>
import SecretSelector from '@shell/components/form/SecretSelector';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import { protocol, updatePort } from './utils';

export default {
  components: {
    Checkbox, LabeledInput, LabeledSelect, SecretSelector
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    mode: {
      type:     String,
      required: true,
    },
    namespace: {
      type:     String,
      required: true
    }
  },

  data() {
    return { protocolOptions: protocol };
  },

  computed: {
    port: {
      get() {
        return this.value.hec_port;
      },
      set(port) {
        updatePort(value => this.$set(this.value, 'hec_port', value), port);
      }
    }
  }
};
</script>

<template>
  <div class="splunk">
    <div>
      <h3>{{ t('logging.output.sections.target') }}</h3>
      <div class="row mb-10">
        <div class="col span-2">
          <LabeledSelect
            v-model="value.protocol"
            :mode="mode"
            :disabled="disabled"
            :options="protocolOptions"
            :label="t('logging.splunk.protocol')"
          />
        </div>
        <div class="col span-8">
          <LabeledInput
            v-model="value.hec_host"
            :mode="mode"
            :disabled="disabled"
            :label="t('logging.splunk.host')"
          />
        </div>
        <div class="col span-2">
          <LabeledInput
            v-model="port"
            :mode="mode"
            :disabled="disabled"
            type="number"
            min="1"
            max="65535"
            :label="t('logging.splunk.port')"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value.index"
            :mode="mode"
            :disabled="disabled"
            :label="t('logging.splunk.indexName')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.source"
            :mode="mode"
            :disabled="disabled"
            :label="t('logging.splunk.source')"
          />
        </div>
      </div>
    </div>
    <div class="spacer" />
    <div>
      <h3>{{ t('logging.output.sections.access') }}</h3>
      <div class="row">
        <div class="col span-6">
          <SecretSelector
            v-model="value.hec_token"
            :mode="mode"
            :namespace="namespace"
            :disabled="disabled"
            :secret-name-label="t('logging.splunk.token')"
            :show-key-selector="true"
          />
        </div>
      </div>
    </div>
    <div class="spacer" />
    <h3>{{ t('logging.output.sections.certificate') }}</h3>
    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox
          v-model="value.insecure_ssl"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.splunk.insecureSsl')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <SecretSelector
          v-model="value.ca_file"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.splunk.caFile')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.ca_path"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.splunk.caPath')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model="value.client_cert"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.splunk.clientCert')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.client_key"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.splunk.clientKey')"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>
