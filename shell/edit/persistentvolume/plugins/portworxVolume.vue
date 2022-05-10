<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import RadioGroup from '@shell/components/form/RadioGroup';

export default {
  components: { LabeledInput, RadioGroup },
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

    this.$set(this.value.spec, 'portworxVolume', this.value.spec.portworxVolume || {});
    this.$set(this.value.spec.portworxVolume, 'readOnly', this.value.spec.portworxVolume.readOnly || false);
    this.$set(this.value.spec.portworxVolume, 'secretRef', this.value.spec.portworxVolume.secretRef || {});

    return { readOnlyOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.spec.portworxVolume.volumeID" :mode="mode" :label="t('persistentVolume.portworxVolume.volumeId.label')" :placeholder="t('persistentVolume.portworxVolume.volumeId.placeholder')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.spec.portworxVolume.fsType" :mode="mode" :label="t('persistentVolume.shared.filesystemType.label')" :placeholder="t('persistentVolume.shared.filesystemType.placeholder')" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="value.spec.portworxVolume.readOnly"
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
