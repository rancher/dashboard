<script>
import FileSelector, { createOnSelected } from '@/components/form/FileSelector';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { protocol, enabledDisabled } from './options';

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
      protocolOptions:        protocol,
      enabledDisabledOptions: enabledDisabled(this.t.bind(this)),
      values:                 { ...this.value.splunk }
    };
  },

  watch: {
    values: {
      deep: true,
      handler() {
        Object.assign(this.value.splunk, this.values);
      }
    }
  },

  methods: { onSslCaCertSelected: createOnSelected('values.client_cert') },
};
</script>

<template>
  <div class="splunk">
    <LabeledInput v-model="values.host" :label="t('logging.splunk.host')" />
    <LabeledInput v-model="values.port" :label="t('logging.splunk.port')" />
    <LabeledSelect v-model="values.protocol" :options="protocolOptions" :label="t('logging.splunk.protocol')" />
    <LabeledInput v-model="values.index" :label="t('logging.splunk.index')" />
    <LabeledInput v-model="values.token" :label="t('logging.splunk.token')" />
    <div>
      <LabeledInput v-model="values.client_cert" type="multiline" :label="t('logging.splunk.clientCert')" />
      <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onSslCaCertSelected" />
    </div>
    <LabeledInput v-model="values.client_key" type="password" :label="t('logging.splunk.clientKey')" />
    <LabeledSelect v-model="values.insecure_ssl" :options="enabledDisabledOptions" :label="t('logging.splunk.insecureSsl')" />
  </div>
</template>

<style lang="scss">
.splunk {
    & > * {
        margin-top: 10px;
    }
}
</style>
