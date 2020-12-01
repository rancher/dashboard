<script>
import SecretSelector from '@/components/form/SecretSelector';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';
import { protocol } from './options';

export default {
  components: {
    Checkbox, LabeledInput, LabeledSelect, SecretSelector
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
  },

  data() {
    return { protocolOptions: protocol };
  },

  computed: {
    port: {
      get() {
        return this.value.hec_port;
      },
      set(port) {
        this.$set(this.value, 'hec_port', Number.parseInt(port));
      }
    }
  }
};
</script>

<template>
  <div class="splunk">
    <div class="bordered-section">
      <h3>{{ t('logging.output.sections.target') }}</h3>
      <div class="row mb-20">
        <div class="col span-2">
          <LabeledSelect v-model="value.protocol" :mode="mode" :disabled="disabled" :options="protocolOptions" :label="t('logging.splunk.protocol')" />
        </div>
        <div class="col span-8">
          <LabeledInput v-model="value.hec_host" :mode="mode" :disabled="disabled" :label="t('logging.splunk.host')" />
        </div>
        <div class="col span-2">
          <LabeledInput v-model="port" :mode="mode" :disabled="disabled" type="number" :label="t('logging.splunk.port')" />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model="value.index" :mode="mode" :disabled="disabled" :label="t('logging.splunk.indexName')" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="value.source" :mode="mode" :disabled="disabled" :label="t('logging.splunk.source')" />
        </div>
      </div>
    </div>
    <div class="bordered-section">
      <h3>{{ t('logging.output.sections.access') }}</h3>
      <div class="row">
        <div class="col span-6">
          <SecretSelector
            v-model="value.hec_token"
            :mode="mode"
            :disabled="disabled"
            :label="t('logging.splunk.token')"
            :show-key-selector="true"
          />
        </div>
      </div>
    </div>

    <h3>{{ t('logging.output.sections.certificate') }}</h3>
    <div class="row">
      <div class="col span-6">
        <Checkbox v-model="value.insecure_ssl" :mode="mode" :disabled="disabled" :label="t('logging.splunk.insecureSsl')" />
      </div>
    </div>
  </div>
</template>
