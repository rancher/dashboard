<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import SecretSelector from '@/components/form/SecretSelector';
import { enabledDisabled, protocol } from './options';

export default {
  components: {
    LabeledInput, LabeledSelect, SecretSelector
  },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return {
      schemes:                protocol,
      enabledDisabledOptions: enabledDisabled(this.t.bind(this)),
      values:                 { ...this.value.kafka }
    };
  },

  watch: {
    values: {
      deep: true,
      handler() {
        Object.assign(this.value.kafka, this.values);
      }
    }
  }
};
</script>

<template>
  <div class="kafka">
    <LabeledInput v-model="values.brokers" :label="t('logging.kafka.brokers')" />
    <LabeledInput v-model="values.default_topic" :label="t('logging.kafka.defaultTopic')" />
    <LabeledSelect v-model="values.sasl_over_ssl" :options="enabledDisabledOptions" :label="t('logging.kafka.saslOverSsl')" />
    <LabeledInput v-model="values.scram_mechanism" :label="t('logging.kafka.scramMechanism')" />
    <SecretSelector v-model="values.username" :label="t('logging.kafka.username')" />
    <SecretSelector v-model="values.password" :label="t('logging.kafka.password')" />
    <SecretSelector v-model="values.ssl_ca_cert" :label="t('logging.kafka.sslCaCert.label')" />
    <SecretSelector v-model="values.ssl_client_cert" :label="t('logging.kafka.sslClientCert.label')" />
    <SecretSelector v-model="values.ssl_client_cert_chain" :label="t('logging.kafka.sslClientCertChain.label')" />
    <SecretSelector v-model="values.ssl_client_cert_key" :label="t('logging.kafka.sslClientCertKey')" />
  </div>
</template>

<style lang="scss">
.kafka {
    & > * {
        margin-top: 10px;
    }
}
</style>
