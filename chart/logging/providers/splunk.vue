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
    };
  },

  methods: { onSslCaCertSelected: createOnSelected('values.client_cert') },
};
</script>

<template>
  <div v-if="value.splunk.enabled" class="splunk">
    <LabeledInput v-model="value.splunk.host" :label="t('logging.splunk.host')" />
    <LabeledInput v-model="value.splunk.port" :label="t('logging.splunk.port')" />
    <LabeledSelect v-model="value.splunk.protocol" :options="protocolOptions" :label="t('logging.splunk.protocol')" />
    <LabeledInput v-model="value.splunk.index" :label="t('logging.splunk.index')" />
    <LabeledInput v-model="value.splunk.token" :label="t('logging.splunk.token')" />
    <div>
      <LabeledInput v-model="value.splunk.client_cert" type="multiline" :label="t('logging.splunk.clientCert')" />
      <FileSelector class="btn-sm bg-primary mt-10" :label="t('generic.readFromFile')" @selected="onSslCaCertSelected" />
    </div>
    <LabeledInput v-model="value.splunk.client_key" type="password" :label="t('logging.splunk.clientKey')" />
    <LabeledSelect v-model="value.splunk.insecure_ssl" :options="enabledDisabledOptions" :label="t('logging.splunk.insecureSsl')" />
  </div>
</template>

<style lang="scss">
.splunk {
    & > * {
        margin-top: 10px;
    }
}
</style>
