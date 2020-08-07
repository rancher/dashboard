<script>
import FileSelector, { createOnSelected } from '@/components/form/FileSelector';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  name:       'ElasticsearchProvider',
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
      schemes:       ['http', 'https'],
      values:   { ...this.value.elasticsearch }
    };
  },

  watch: {
    values: {
      deep: true,
      handler() {
        Object.assign(this.value.elasticsearch, this.values);
      }
    }
  },

  methods: {
    onCertSelected: createOnSelected('values.client_cert'),
    onKeySelected:  createOnSelected('values.client_key')
  },
};
</script>

<template>
  <div class="elasticsearch">
    <LabeledInput v-model="values.host" :label="t('logging.kafka.brokers')" />
    <LabeledSelect v-model="values.scheme" :options="schemes" :label="t('logging.kafka.defailtTopic')" />
    <LabeledInput v-model="values.port" :label="t('logging.kafka.saslOverSsl')" />
    <LabeledInput v-model="values.index_name" :label="t('logging.kafka.scramMechanism')" />
    <LabeledInput v-model="values.user" :label="t('logging.kafka.username')" />
    <LabeledInput v-model="values.password" :label="t('logging.kafka.password')" type="password" />
    <LabeledInput v-model="values.user" :label="t('logging.kafka.sslCaCert')" />
    <LabeledInput v-model="values.user" :label="t('logging.kafka.sslClientCert')" />
    <LabeledInput v-model="values.user" :label="t('logging.kafka.sslClientCertChain')" />
    <LabeledInput v-model="values.user" :label="t('logging.kafka.sslClientCertKey')" />
  </div>
</template>

<style lang="scss">
.elasticsearch {
    & > * {
        margin-top: 10px;
    }
}
</style>
