<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';

export default {
  components: {
    Checkbox, LabeledInput, SecretSelector
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
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.host"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.datadog.host')"
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
          v-model:value="value.api_key"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.datadog.apiKey')"
          :show-key-selector="true"
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
        <Checkbox
          v-model:value="value.use_ssl"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.datadog.useSSL')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <Checkbox
          v-model:value="value.use_compression"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.datadog.useCompression')"
        />
      </div>
    </div>
  </div>
</template>
