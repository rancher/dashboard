<script>
import LabeledInput from '@shell/components/form/LabeledInput';

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
  <div class="forward">
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.path" :mode="mode" :disabled="disabled" :label="t('logging.file.path')" />
      </div>
    </div>
  </div>
</template>
