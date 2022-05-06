<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';

export default {
  components: { LabeledInput, SecretSelector },
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
          v-model="value.source_name"
          class="source-name"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.sumologic.sourceName')"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.endpoint"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.sumologic.endpoint')"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>
