<script>
import { LabeledInput } from '@components/Form/LabeledInput';
export default {
  components: { LabeledInput },

  props: {
    value: {
      type:    Object,
      default: () => ({
        name:   '',
        target: {},
      }),
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },
};
</script>

<template>
  <div class="col span-12">
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.apiVersion"
          :mode="mode"
          :label="t('hpa.objectReference.api.label')"
          :required="true"
          :placeholder="t('hpa.objectReference.api.placeholder')"
          type="text"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.kind"
          :mode="mode"
          :label="t('hpa.objectReference.kind.label')"
          :required="true"
          :placeholder="t('hpa.objectReference.kind.placeholder')"
          type="text"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.name"
          :mode="mode"
          :label="t('hpa.objectReference.name.label')"
          :required="true"
          :placeholder="t('hpa.objectReference.name.placeholder')"
          type="text"
        />
      </div>
    </div>
  </div>
</template>
