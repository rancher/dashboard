<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';
import { updatePort } from './utils';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: {
    LabeledInput, LabeledSelect, SecretSelector
  },
  props: {
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
    namespace: {
      type:     String,
      required: true
    }
  },
  data() {
    const formatTypeOptions = ['json', 'out_file', 'ltsv', 'csv', 'msgpack', 'hash', 'single_value'];

    this.value['format'] = this.value.format || { type: formatTypeOptions[0] };

    return { formatTypeOptions };
  },
  computed: {
    port: {
      get() {
        return this.value.port;
      },
      set(port) {
        updatePort((value) => (this.value.port = value), port);
      }
    }
  }
};
</script>

<template>
  <div class="opensearch">
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-8">
        <LabeledInput
          v-model:value="value.host"
          :mode="mode"
          :disabled="disabled"
          class="host"
          :label="t('logging.redis.host')"
        />
      </div>
      <div class="col span-2">
        <LabeledInput
          v-model:value.number="port"
          :mode="mode"
          :disabled="disabled"
          class="port"
          type="number"
          min="1"
          max="65535"
          :label="t('logging.redis.port')"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model:value.number="value.db_number"
          :mode="mode"
          :disabled="disabled"
          type="number"
          :label="t('logging.redis.dbNumber')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value.number="value.ttl"
          :mode="mode"
          :disabled="disabled"
          type="number"
          :label="t('logging.redis.ttl')"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.redis.format.title') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.format.type"
          :options="formatTypeOptions"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.redis.format.type')"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.access') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.password"
          :secret-name-label="t('logging.elasticsearch.password')"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>
<style>
.row {
  margin-bottom: 5px;
}
</style>
