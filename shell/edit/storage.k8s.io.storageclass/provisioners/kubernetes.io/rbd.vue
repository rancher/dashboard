<script>
import LabeledInput from '@shell/components/form/LabeledInput';

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
        <LabeledInput v-model="value.parameters.monitors" :placeholder="t('storageClass.rbd.monitors.placeholder')" :label="t('storageClass.rbd.monitors.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.adminId" :placeholder="t('storageClass.rbd.adminId.placeholder')" :label="t('storageClass.rbd.adminId.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.adminSecretNamespace" :placeholder="t('storageClass.rbd.adminSecretNamespace.placeholder')" :label="t('storageClass.rbd.adminSecretNamespace.label')" :mode="mode" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.adminSecretName" :placeholder="t('storageClass.rbd.adminSecret.placeholder')" :label="t('storageClass.rbd.adminSecret.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.pool" :placeholder="t('storageClass.rbd.pool.placeholder')" :label="t('storageClass.rbd.pool.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.userId" :placeholder="t('storageClass.rbd.userId.placeholder')" :label="t('storageClass.rbd.userId.label')" :mode="mode" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.userSecretNamespace" :placeholder="t('storageClass.rbd.userSecretNamespace.placeholder')" :label="t('storageClass.rbd.userSecretNamespace.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.userSecretName" :placeholder="t('storageClass.rbd.userSecretName.placeholder')" :label="t('storageClass.rbd.userSecretName.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.fsType" :placeholder="t('storageClass.rbd.filesystemType.placeholder')" :label="t('storageClass.rbd.filesystemType.label')" :mode="mode" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.imageFormat" :placeholder="t('storageClass.rbd.imageFormat.placeholder')" :label="t('storageClass.rbd.imageFormat.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.imageFeatures" :placeholder="t('storageClass.rbd.imageFeatures.placeholder')" :label="t('storageClass.rbd.imageFeatures.label')" :mode="mode" />
      </div>
    </div>
  </div>
</template>
