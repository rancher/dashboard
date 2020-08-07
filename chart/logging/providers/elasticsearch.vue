<script>
import FileSelector, { createOnSelected } from '@/components/form/FileSelector';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { protocol } from './options';

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
  },

  methods: {
    onCertSelected: createOnSelected('values.client_cert'),
    onKeySelected:  createOnSelected('values.client_key')
  },
};
</script>

<template>
  <div class="elasticsearch">
    <LabeledInput v-model="values.host" :label="t('logging.elasticsearch.host')" />
    <LabeledSelect v-model="values.scheme" :options="protocolOptions" :label="t('logging.elasticsearch.scheme')" />
    <LabeledInput v-model="values.port" :label="t('logging.elasticsearch.port')" />
    <LabeledInput v-model="values.index_name" :label="t('logging.elasticsearch.indexName')" />
    <LabeledInput v-model="values.user" :label="t('logging.elasticsearch.user')" />
    <LabeledInput v-model="values.password" :label="t('logging.elasticsearch.password')" type="password" />
    <div class="cert row">
      <div class="col span-6">
        <LabeledInput v-model="values.client_cert" type="multiline" :label="t('logging.elasticsearch.clientCert.label')" :placeholder="t('logging.elasticsearch.clientCert.placeholder')" />
        <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onCertSelected" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="values.client_key" type="multiline" :label="t('logging.elasticsearch.clientKey.label')" :placeholder="t('logging.elasticsearch.clientKey.placeholder')" />
        <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onKeySelected" />
      </div>
    </div>
    <LabeledInput v-model="values.client_key_pass" :label="t('logging.elasticsearch.clientKeyPass')" type="password" />
  </div>
</template>

<style lang="scss">
.elasticsearch {
    & > * {
        margin-top: 10px;
    }
}
</style>
