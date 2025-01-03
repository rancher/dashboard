<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SecretSelector from '@shell/components/form/SecretSelector';

export default {
  components: {
    Checkbox, LabeledInput, LabeledSelect, SecretSelector
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
    const transportOptions = ['tls', 'udp', 'tcp'];

    this.value['format'] = this.value.format || { type: formatTypeOptions[0] };
    this.value['buffer'] = this.value.buffer || {};
    this.value['transport'] = this.value.transport || transportOptions[0];

    return { formatTypeOptions, transportOptions };
  },
  computed: {
    port: {
      get() {
        return this.value.port;
      },
      set(port) {
        this.value['port'] = Number.parseInt(port);
      }
    },
    chunkLimitRecords: {
      get() {
        return this.value.buffer.chunk_limit_records;
      },
      set(chunkLimitRecords) {
        this.value.buffer['chunk_limit_records'] = Number.parseInt(chunkLimitRecords);
      }
    }
  }
};
</script>

<template>
  <div class="elasticsearch">
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-8">
        <LabeledInput
          v-model:value="value.host"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.host')"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="port"
          :mode="mode"
          :disabled="disabled"
          class="port"
          type="number"
          :label="t('logging.syslog.port')"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.certificate') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.transport"
          :options="transportOptions"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.transport')"
        />
      </div>
      <div class="col span-6 insecure">
        <Checkbox
          v-model:value="value.insecure"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.insecure')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.trusted_ca_path"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.syslog.trustedCaPath')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.syslog.format.title') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.format.type"
          :options="formatTypeOptions"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.format.type')"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.syslog.buffer.title') }}</h3>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.buffer.tags"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.buffer.tags')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.buffer.chunk_limit_size"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.buffer.chunkLimitSize')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="chunkLimitRecords"
          :mode="mode"
          :disabled="disabled"
          type="number"
          :label="t('logging.syslog.buffer.chunkLimitRecords')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.buffer.total_limit_size"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.buffer.totalLimitSize')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.buffer.flush_interval"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.buffer.flushInterval')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.buffer.timekey"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.buffer.timekey')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.buffer.timekey_wait"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.buffer.timekeyWait')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox
          v-model:value="value.buffer.timekey_use_utc"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.syslog.buffer.timekeyUseUTC')"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.insecure {
    display: flex;
    align-items: center;
}
</style>
