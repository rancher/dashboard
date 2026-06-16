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
  created() {
    this.value.spec['photonPersistentDisk'] = this.value.spec.photonPersistentDisk || {};
    this.value.spec.photonPersistentDisk['readOnly'] = this.value.spec.photonPersistentDisk.readOnly || false;
    this.value.spec.photonPersistentDisk['secretRef'] = this.value.spec.photonPersistentDisk.secretRef || {};
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.photonPersistentDisk.pdID"
          :mode="mode"
          :label="t('persistentVolume.photonPersistentDisk.pdId.label')"
          :placeholder="t('persistentVolume.photonPersistentDisk.pdId.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.photonPersistentDisk.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
    </div>
  </div>
</template>
