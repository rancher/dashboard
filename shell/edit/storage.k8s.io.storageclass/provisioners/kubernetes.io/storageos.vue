<script>
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  }
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.pool"
          :placeholder="t('storageClass.storageos.pool.placeholder')"
          :label="t('storageClass.storageos.pool.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.description"
          :placeholder="t('storageClass.storageos.description.placeholder')"
          :label="t('storageClass.storageos.description.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.fsType"
          :placeholder="t('storageClass.storageos.filesystemType.placeholder')"
          :label="t('storageClass.storageos.filesystemType.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.adminSecretNamespace"
          :placeholder="t('storageClass.storageos.adminSecretNamespace.placeholder')"
          :label="t('storageClass.storageos.adminSecretNamespace.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.adminSecretName"
          :placeholder="t('storageClass.storageos.adminSecretName.placeholder')"
          :label="t('storageClass.storageos.adminSecretName.label')"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
