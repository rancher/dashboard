<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

export default {
  components: { LabeledInput, RadioGroup },
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
    const yesNoOptions = [
      {
        label: this.t('generic.yes'),
        value: true
      },
      {
        label: this.t('generic.no'),
        value: false
      }
    ];

    this.value.spec['scaleIO'] = this.value.spec.scaleIO || {};
    this.value.spec.scaleIO['readOnly'] = this.value.spec.scaleIO.readOnly || false;
    this.value.spec.scaleIO['secretRef'] = this.value.spec.scaleIO.secretRef || {};
    this.value.spec.scaleIO['sslEnabled'] = this.value.spec.scaleIO.sslEnabled || false;

    return { yesNoOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.scaleIO.volumeName"
          :mode="mode"
          :label="t('persistentVolume.scaleIO.volumeName.label')"
          :placeholder="t('persistentVolume.scaleIO.volumeName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.scaleIO.gateway"
          :mode="mode"
          :label="t('persistentVolume.scaleIO.gateway.label')"
          :placeholder="t('persistentVolume.scaleIO.gateway.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.scaleIO.protectionDomain"
          :mode="mode"
          :label="t('persistentVolume.scaleIO.protectionDomain.label')"
          :placeholder="t('persistentVolume.scaleIO.protectionDomain.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.scaleIO.storageMode"
          :mode="mode"
          :label="t('persistentVolume.scaleIO.storageMode.label')"
          :placeholder="t('persistentVolume.scaleIO.storageMode.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.scaleIO.storagePool"
          :mode="mode"
          :label="t('persistentVolume.scaleIO.storagePool.label')"
          :placeholder="t('persistentVolume.scaleIO.storagePool.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.scaleIO.system"
          :mode="mode"
          :label="t('persistentVolume.scaleIO.system.label')"
          :placeholder="t('persistentVolume.scaleIO.system.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.scaleIO.sslEnabled"
          name="readOnly"
          :mode="mode"
          :label="t('persistentVolume.scaleIO.sslEnabled.label')"
          :options="yesNoOptions"
          :row="true"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.scaleIO.secretRef.name"
          :mode="mode"
          :label="t('persistentVolume.shared.secretName.label')"
          :placeholder="t('persistentVolume.shared.secretName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.scaleIO.secretRef.namespace"
          :mode="mode"
          :label="t('persistentVolume.shared.secretNamespace.label')"
          :placeholder="t('persistentVolume.shared.secretNamespace.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.scaleIO.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.scaleIO.readOnly"
          name="readOnly"
          :mode="mode"
          :label="t('persistentVolume.shared.readOnly.label')"
          :options="yesNoOptions"
          :row="true"
        />
      </div>
    </div>
  </div>
</template>
