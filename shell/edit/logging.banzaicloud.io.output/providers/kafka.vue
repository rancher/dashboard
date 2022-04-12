<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';
import Checkbox from '@shell/components/form/Checkbox';
import { protocol } from './utils';

export default {
  components: {
    Checkbox, LabeledInput, SecretSelector
  },
  props:      {
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
    return { schemes: protocol };
  },
};
</script>

<template>
  <div class="kafka">
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.brokers" :mode="mode" :disabled="disabled" :label="t('logging.kafka.brokers')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.default_topic" :mode="mode" :disabled="disabled" :label="t('logging.kafka.defaultTopic')" />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.access') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <SecretSelector
          v-model="value.username"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.kafka.username')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.password"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.kafka.password')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.scram_mechanism" :mode="mode" :disabled="disabled" :label="t('logging.kafka.scramMechanism')" />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.certificate') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox v-model="value.sasl_over_ssl" :mode="mode" :disabled="disabled" :label="t('logging.kafka.saslOverSsl')" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <SecretSelector
          v-model="value.ssl_ca_cert"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.kafka.sslCaCert.label')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.ssl_client_cert"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.kafka.sslClientCert.label')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <SecretSelector
          v-model="value.ssl_client_cert_chain"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.kafka.sslClientCertChain.label')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.ssl_client_cert_key"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.kafka.sslClientCertKey')"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>
