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

    this.$set(this.value.spec, 'photonPersistentDisk', this.value.spec.photonPersistentDisk || {});
    this.$set(this.value.spec.photonPersistentDisk, 'readOnly', this.value.spec.photonPersistentDisk.readOnly || false);
    this.$set(this.value.spec.photonPersistentDisk, 'secretRef', this.value.spec.photonPersistentDisk.secretRef || {});

    return { readOnlyOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.spec.photonPersistentDisk.pdID" :mode="mode" :label="t('persistentVolume.photonPersistentDisk.pdId.label')" :placeholder="t('persistentVolume.photonPersistentDisk.pdId.placeholder')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.spec.photonPersistentDisk.fsType" :mode="mode" :label="t('persistentVolume.shared.filesystemType.label')" :placeholder="t('persistentVolume.shared.filesystemType.placeholder')" />
      </div>
    </div>
  </div>
</template>
