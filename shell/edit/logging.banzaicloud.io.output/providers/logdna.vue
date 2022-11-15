<script>
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },
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
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.hostname"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.logdna.hostname')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.app"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.logdna.app')"
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
        <LabeledInput
          v-model="value.api_key"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.logdna.apiKey')"
          :required="true"
        />
      </div>
    </div>
  </div>
</template>
