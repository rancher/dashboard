<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

export default {
  components: { RadioGroup, LabeledInput },
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
    const readOnlyOptions = [
      {
        label: this.t('generic.yes'),
        value: true
      },
      {
        label: this.t('generic.no'),
        value: false
      }
    ];

    this.$set(this.value.spec, 'glusterfs', this.value.spec.glusterfs || {});
    this.$set(this.value.spec.glusterfs, 'readOnly', this.value.spec.glusterfs.readOnly || false);

    return { readOnlyOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.glusterfs.endpoints"
          :mode="mode"
          :label="t('persistentVolume.glusterfs.endpoints.label')"
          :placeholder="t('persistentVolume.glusterfs.endpoints.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.glusterfs.path"
          :mode="mode"
          :label="t('persistentVolume.glusterfs.path.label')"
          :placeholder="t('persistentVolume.glusterfs.path.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="value.spec.glusterfs.readOnly"
          name="readOnly"
          :mode="mode"
          :label="t('persistentVolume.shared.readOnly.label')"
          :options="readOnlyOptions"
          :row="true"
        />
      </div>
    </div>
  </div>
</template>
