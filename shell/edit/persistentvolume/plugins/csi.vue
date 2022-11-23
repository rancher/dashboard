<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import KeyValue from '@shell/components/form/KeyValue';

export default {
  components: {
    KeyValue, LabeledInput, RadioGroup
  },
  props: {
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

    this.$set(this.value.spec, 'csi', this.value.spec.csi || {});
    this.$set(this.value.spec.csi, 'readOnly', this.value.spec.csi.readOnly || false);
    this.$set(this.value.spec.csi, 'nodePublishSecretRef', this.value.spec.csi.nodePublishSecretRef || {});
    this.$set(this.value.spec.csi, 'nodeStageSecretRef', this.value.spec.csi.nodeStageSecretRef || {});
    this.$set(this.value.spec.csi, 'controllerExpandSecretRef', this.value.spec.csi.controllerExpandSecretRef || {});
    this.$set(this.value.spec.csi, 'controllerPublishSecretRef', this.value.spec.csi.controllerPublishSecretRef || {});

    return { readOnlyOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.driver"
          :mode="mode"
          :label="t('persistentVolume.csi.driver.label')"
          :placeholder="t('persistentVolume.csi.driver.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.volumeHandle"
          :mode="mode"
          :label="t('persistentVolume.csi.volumeHandle.label')"
          :placeholder="t('persistentVolume.csi.volumeHandle.placeholder')"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="value.spec.csi.readOnly"
          name="readOnly"
          :mode="mode"
          :label="t('persistentVolume.shared.readOnly.label')"
          :options="readOnlyOptions"
          :row="true"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <KeyValue
          v-model="value.spec.csi.volumeAttributes"
          :add-label="t('persistentVolume.csi.volumeAttributes.add')"
          :mode="mode"
          :read-allowed="false"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.nodePublishSecretRef.name"
          :mode="mode"
          :label="t('persistentVolume.csi.nodePublishSecretName.label')"
          :placeholder="t('persistentVolume.csi.nodePublishSecretName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.nodePublishSecretRef.namespace"
          :mode="mode"
          :label="t('persistentVolume.csi.nodePublishSecretNamespace.label')"
          :placeholder="t('persistentVolume.csi.nodePublishSecretNamespace.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.nodeStageSecretRef.name"
          :mode="mode"
          :label="t('persistentVolume.csi.nodeStageSecretName.label')"
          :placeholder="t('persistentVolume.csi.nodeStageSecretName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.nodeStageSecretRef.namespace"
          :mode="mode"
          :label="t('persistentVolume.csi.nodeStageSecretNamespace.label')"
          :placeholder="t('persistentVolume.csi.nodeStageSecretNamespace.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.controllerExpandSecretRef.name"
          :mode="mode"
          :label="t('persistentVolume.csi.controllerExpandSecretName.label')"
          :placeholder="t('persistentVolume.csi.controllerExpandSecretName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.controllerExpandSecretRef.namespace"
          :mode="mode"
          :label="t('persistentVolume.csi.controllerExpandSecretNamespace.label')"
          :placeholder="t('persistentVolume.csi.controllerExpandSecretNamespace.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.controllerPublishSecretRef.name"
          :mode="mode"
          :label="t('persistentVolume.csi.controllerPublishSecretName.label')"
          :placeholder="t('persistentVolume.csi.controllerPublishSecretName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.csi.controllerPublishSecretRef.namespace"
          :mode="mode"
          :label="t('persistentVolume.csi.controllerPublishSecretNamespace.label')"
          :placeholder="t('persistentVolume.csi.controllerPublishSecretNamespace.placeholder')"
        />
      </div>
    </div>
  </div>
</template>
