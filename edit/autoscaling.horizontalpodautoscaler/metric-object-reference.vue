<script>
import LabeledInput from '@/components/form/LabeledInput';
export default {
  components: { LabeledInput },

  props:      {
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
          v-model="value.apiVersion"
          :mode="mode"
          :label="t('hpa.objectReferance.api.label')"
          :required="true"
          :placeholder="t('hpa.objectReferance.api.placeholder')"
          type="text"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.kind"
          :mode="mode"
          :label="t('hpa.objectReferance.kind.label')"
          :required="true"
          :placeholder="t('hpa.objectReferance.kind.placeholder')"
          type="text"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="value.name"
          :mode="mode"
          :label="t('hpa.objectReferance.name.label')"
          :required="true"
          :placeholder="t('hpa.objectReferance.name.placeholder')"
          type="text"
        />
      </div>
    </div>
  </div>
</template>
