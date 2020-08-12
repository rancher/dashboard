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
  },

  methods: {
    onSslCaCertSelected:          createOnSelected('values.ssl_ca_cert'),
    onSslClientCertChainSelected:  createOnSelected('values.ssl_client_cert_chain'),
    onSslClientCertSelected:      createOnSelected('values.ssl_client_cert'),
  },
};
</script>

<template>
  <div class="kafka">
    <LabeledInput v-model="values.brokers" :label="t('logging.kafka.brokers')" />
    <LabeledInput v-model="values.default_topic" :label="t('logging.kafka.defaultTopic')" />
    <LabeledSelect v-model="values.sasl_over_ssl" :options="enabledDisabledOptions" :label="t('logging.kafka.saslOverSsl')" />
    <LabeledInput v-model="values.scram_mechanism" :label="t('logging.kafka.scramMechanism')" />
    <LabeledInput v-model="values.username" :label="t('logging.kafka.username')" />
    <LabeledInput v-model="values.password" :label="t('logging.kafka.password')" type="password" />
    <div>
      <LabeledInput v-model="values.ssl_ca_cert" type="multiline" :label="t('logging.kafka.sslCaCert.label')" :placeholder="t('logging.kafka.sslCaCert.placeholder')" />
      <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onSslCaCertSelected" />
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="values.ssl_client_cert" type="multiline" :label="t('logging.kafka.sslClientCert.label')" :placeholder="t('logging.kafka.sslClientCert.placeholder')" />
        <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onSslClientCertSelected" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="values.ssl_client_cert_chain" type="multiline" :label="t('logging.kafka.sslClientCertChain.label')" :placeholder="t('logging.kafka.sslClientCertChain.placeholder')" />
        <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onSslClientCertChainSelected" />
      </div>
    </div>
    <LabeledInput v-model="values.ssl_client_cert_key" :label="t('logging.kafka.sslClientCertKey')" type="password" />
  </div>
</template>

<style lang="scss">
.kafka {
    & > * {
        margin-top: 10px;
    }
}
</style>
