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
        <LabeledInput v-model="value.parameters.skuName" :placeholder="t('storageClass.azure-file.skuName.placeholder')" :label="t('storageClass.azure-file.skuName.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.location" :placeholder="t('storageClass.azure-file.location.placeholder')" :label="t('storageClass.azure-file.location.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.storageAccount" :placeholder="t('storageClass.azure-file.storageAccount.placeholder')" :label="t('storageClass.azure-file.storageAccount.label')" :mode="mode" />
      </div>
    </div>
  </div>
</template>
