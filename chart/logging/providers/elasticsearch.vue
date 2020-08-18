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
    return { protocolOptions: protocol };
  },

  methods: {
    onCertSelected: createOnSelected('value.elasticsearch.client_cert'),
    onKeySelected:  createOnSelected('value.elasticsearch.client_key')
  },
};
</script>

<template>
  <div v-if="value.elasticsearch.enabled" class="elasticsearch">
    <LabeledInput v-model="value.elasticsearch.host" :label="t('logging.elasticsearch.host')" />
    <LabeledSelect v-model="value.elasticsearch.scheme" :options="protocolOptions" :label="t('logging.elasticsearch.scheme')" />
    <LabeledInput v-model="value.elasticsearch.port" :label="t('logging.elasticsearch.port')" />
    <LabeledInput v-model="value.elasticsearch.index_name" :label="t('logging.elasticsearch.indexName')" />
    <LabeledInput v-model="value.elasticsearch.user" :label="t('logging.elasticsearch.user')" />
    <LabeledInput v-model="value.elasticsearch.password" :label="t('logging.elasticsearch.password')" type="password" />
    <div class="cert row">
      <div class="col span-6">
        <LabeledInput v-model="value.elasticsearch.client_cert" type="multiline" :label="t('logging.elasticsearch.clientCert.label')" :placeholder="t('logging.elasticsearch.clientCert.placeholder')" />
        <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onCertSelected" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.elasticsearch.client_key" type="multiline" :label="t('logging.elasticsearch.clientKey.label')" :placeholder="t('logging.elasticsearch.clientKey.placeholder')" />
        <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onKeySelected" />
      </div>
    </div>
    <LabeledInput v-model="value.elasticsearch.client_key_pass" :label="t('logging.elasticsearch.clientKeyPass')" type="password" />
  </div>
</template>

<style lang="scss">
.elasticsearch {
    & > * {
        margin-top: 10px;
    }
}
</style>
