<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: { LabeledInput, LabeledSelect },
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  },
  data() {
    return {
      storageModeOptions: [
        {
          label: this.t('storageClass.scaleio.storageMode.thin'),
          value: 'ThinProvisioned'
        },
        {
          label: this.t('storageClass.scaleio.storageMode.thick'),
          value: 'ThickProvisioned'
        }
      ],
      readOnlyOptions: [
        {
          label: this.t('generic.yes'),
          value: 'true'
        },
        {
          label: this.t('generic.no'),
          value: 'false'
        }
      ]
    };
  },
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.gateway"
          :placeholder="t('storageClass.scaleio.gateway.placeholder')"
          :label="t('storageClass.scaleio.gateway.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.system"
          :placeholder="t('storageClass.scaleio.system.placeholder')"
          :label="t('storageClass.scaleio.system.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.protectionDomain"
          :placeholder="t('storageClass.scaleio.protectionDomain.placeholder')"
          :label="t('storageClass.scaleio.protectionDomain.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.storagePool"
          :placeholder="t('storageClass.scaleio.storagePool.placeholder')"
          :label="t('storageClass.scaleio.storagePool.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model="value.parameters.storageMode"
          :options="storageModeOptions"
          :label="t('storageClass.scaleio.storageMode.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.secretRef"
          :placeholder="t('storageClass.scaleio.secretRef.placeholder')"
          :label="t('storageClass.scaleio.secretRef.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledSelect
          v-model="value.parameters.readOnly"
          :options="readOnlyOptions"
          :label="t('storageClass.scaleio.readOnly.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.fsType"
          :placeholder="t('storageClass.scaleio.filesystemType.placeholder')"
          :label="t('storageClass.scaleio.filesystemType.label')"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
