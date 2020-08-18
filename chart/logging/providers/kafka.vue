<script>
import FileSelector, { createOnSelected } from '@/components/form/FileSelector';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { enabledDisabled, protocol } from './options';

export default {
  components: {
    FileSelector, LabeledInput, LabeledSelect
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
    };
  },

  methods: {
    onSslCaCertSelected:          createOnSelected('values.ssl_ca_cert'),
    onSslClientCertChainSelected:  createOnSelected('values.ssl_client_cert_chain'),
    onSslClientCertSelected:      createOnSelected('values.ssl_client_cert'),
  },
};
</script>

<template>
  <div v-if="value.kafka.enabled" class="kafka">
    <LabeledInput v-model="value.kafka.brokers" :label="t('logging.kafka.brokers')" />
    <LabeledInput v-model="value.kafka.default_topic" :label="t('logging.kafka.defaultTopic')" />
    <LabeledSelect v-model="value.kafka.sasl_over_ssl" :options="enabledDisabledOptions" :label="t('logging.kafka.saslOverSsl')" />
    <LabeledInput v-model="value.kafka.scram_mechanism" :label="t('logging.kafka.scramMechanism')" />
    <LabeledInput v-model="value.kafka.username" :label="t('logging.kafka.username')" />
    <LabeledInput v-model="value.kafka.password" :label="t('logging.kafka.password')" type="password" />
    <div>
      <LabeledInput v-model="value.kafka.ssl_ca_cert" type="multiline" :label="t('logging.kafka.sslCaCert.label')" :placeholder="t('logging.kafka.sslCaCert.placeholder')" />
      <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onSslCaCertSelected" />
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.kafka.ssl_client_cert" type="multiline" :label="t('logging.kafka.sslClientCert.label')" :placeholder="t('logging.kafka.sslClientCert.placeholder')" />
        <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onSslClientCertSelected" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.kafka.ssl_client_cert_chain" type="multiline" :label="t('logging.kafka.sslClientCertChain.label')" :placeholder="t('logging.kafka.sslClientCertChain.placeholder')" />
        <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onSslClientCertChainSelected" />
      </div>
    </div>
    <LabeledInput v-model="value.kafka.ssl_client_cert_key" :label="t('logging.kafka.sslClientCertKey')" type="password" />
  </div>
</template>

<style lang="scss">
.kafka {
    & > * {
        margin-top: 10px;
    }
}
</style>
