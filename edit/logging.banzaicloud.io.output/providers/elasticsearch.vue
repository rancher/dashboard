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
        return this.value.port;
      },
      set(port) {
        this.$set(this.value, 'port', Number.parseInt(port));
      }
    }
  }
};
</script>

<template>
  <div class="elasticsearch">
    <div>
      <h3>{{ t('logging.output.sections.target') }}</h3>
      <div class="row mb-10">
        <div class="col span-2">
          <LabeledSelect
            v-model="value.scheme"
            :mode="mode"
            :disabled="disabled"
            class="scheme"
            :options="protocolOptions"
            :label="t('logging.elasticsearch.scheme')"
          />
        </div>
        <div class="col span-8">
          <LabeledInput v-model="value.host" :mode="mode" :disabled="disabled" class="host" :label="t('logging.elasticsearch.host')" />
        </div>
        <div class="col span-2">
          <LabeledInput
            v-model="port"
            :mode="mode"
            :disabled="disabled"
            class="port"
            type="number"
            :label="t('logging.elasticsearch.port')"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model="value.index_name" :mode="mode" :disabled="disabled" :label="t('logging.elasticsearch.indexName')" />
        </div>
      </div>
    </div>
    <hr class="section-divider" />

    <div>
      <h3>{{ t('logging.output.sections.access') }}</h3>
      <div class="row">
        <div class="col span-6">
          <label>{{ t('logging.elasticsearch.user') }}</label>
          <LabeledInput v-model="value.user" :mode="mode" :disabled="disabled" />
        </div>
        <div class="col span-6">
          <SecretSelector
            v-model="value.password"
            :mode="mode"
            :disabled="disabled"
            :label="t('logging.elasticsearch.password')"
            :show-key-selector="true"
          />
        </div>
      </div>
    </div>
    <hr class="section-divider" />

    <h3>{{ t('logging.output.sections.certificate') }}</h3>
    <div class="row mb-10">
      <div class="col span-6">
        <SecretSelector
          v-model="value.ca_file"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.elasticsearch.caFile.label')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.client_cert"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.elasticsearch.clientCert.label')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model="value.client_key"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.elasticsearch.clientKey.label')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.client_key_pass"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.elasticsearch.clientKeyPass')"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>
