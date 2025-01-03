<script>
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      required: true,
    },
  },
  data() {
    this.value.spec['local'] = this.value.spec.local || {};

    return { };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.local.path"
          :mode="mode"
          :label="t('persistentVolume.local.path.label')"
          :placeholder="t('persistentVolume.local.path.placeholder')"
        />
      </div>
    </div>
  </div>
</template>
