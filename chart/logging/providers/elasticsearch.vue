<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import SecretSelector from '@/components/form/SecretSelector';
import { protocol } from './options';

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
      protocolOptions: protocol,
      values:          { ...this.value.elasticsearch }
    };
  },

  watch: {
    values: {
      deep: true,
      handler() {
        Object.assign(this.value.elasticsearch, this.values);
      }
    }
  }
};
</script>

<template>
  <div class="elasticsearch">
    <LabeledInput v-model="values.host" :label="t('logging.elasticsearch.host')" />
    <LabeledSelect v-model="values.scheme" :options="protocolOptions" :label="t('logging.elasticsearch.scheme')" />
    <LabeledInput v-model="values.port" :label="t('logging.elasticsearch.port')" />
    <LabeledInput v-model="values.index_name" :label="t('logging.elasticsearch.indexName')" />
    <LabeledInput v-model="values.user" :label="t('logging.elasticsearch.user')" />
    <SecretSelector v-model="values.password" :label="t('logging.elasticsearch.password')" />
    <SecretSelector v-model="values.client_cert" :label="t('logging.elasticsearch.clientCert.label')" />
    <SecretSelector v-model="values.client_key" :label="t('logging.elasticsearch.clientKey.label')" />
    <SecretSelector v-model="values.client_key_pass" :label="t('logging.elasticsearch.clientKeyPass')" />
  </div>
</template>

<style lang="scss">
.elasticsearch {
    & > * {
        margin-top: 10px;
    }
}
</style>
