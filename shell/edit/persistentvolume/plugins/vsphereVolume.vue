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
    this.$set(this.value.spec, 'vsphereVolume', this.value.spec.vsphereVolume || {});

    return { };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.spec.vsphereVolume.volumePath" :mode="mode" :label="t('persistentVolume.vsphereVolume.volumePath.label')" :placeholder="t('persistentVolume.vsphereVolume.volumePath.placeholder')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.spec.vsphereVolume.storagePolicyName" :mode="mode" :label="t('persistentVolume.vsphereVolume.storagePolicyName.label')" :placeholder="t('persistentVolume.vsphereVolume.storagePolicyName.placeholder')" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.spec.vsphereVolume.storagePolicyID" :mode="mode" :label="t('persistentVolume.vsphereVolume.storagePolicyId.label')" :placeholder="t('persistentVolume.vsphereVolume.storagePolicyId.placeholder')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.spec.vsphereVolume.fsType" :mode="mode" :label="t('persistentVolume.shared.filesystemType.label')" :placeholder="t('persistentVolume.shared.filesystemType.placeholder')" />
      </div>
    </div>
  </div>
</template>
