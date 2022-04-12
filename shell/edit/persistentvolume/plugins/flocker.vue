<script>
import LabeledInput from '@shell/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    value:      {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      required: true,
    },
  },
  data() {
    this.$set(this.value.spec, 'flocker', this.value.spec.flocker || {});

    return {};
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.spec.flocker.datasetName" :mode="mode" :label="t('persistentVolume.flocker.datasetName.label')" :placeholder="t('persistentVolume.flocker.datasetName.placeholder')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.spec.flocker.datasetUUID" :mode="mode" :label="t('persistentVolume.flocker.datasetUUID.label')" :placeholder="t('persistentVolume.flocker.datasetUUID.placeholder')" />
      </div>
    </div>
  </div>
</template>
