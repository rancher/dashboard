<script>
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';

export default {
  components: {
    LabeledInput, KeyValue, RadioGroup
  },
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
    const defaultVolumeAttributes = {
      size:                '2Gi',
      numberOfReplicas:    '3',
      staleReplicaTimeout: '20',
      fromBackup:          ''
    };

    this.$set(this.value.spec, 'csi', this.value.spec.csi || {});
    this.$set(this.value.spec.csi, 'readOnly', this.value.spec.csi.readOnly || false);
    this.$set(this.value.spec.csi, 'volumeAttributes', this.value.spec.csi.volumeAttributes || defaultVolumeAttributes);

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

    return { readOnlyOptions };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="value.spec.csi.fsType" :mode="mode" :label="t('persistentVolume.shared.filesystemType.label')" :placeholder="t('persistentVolume.shared.filesystemType.placeholder')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.spec.csi.volumeHandle" :mode="mode" :label="t('persistentVolume.csi.volumeHandle.label')" :placeholder="t('persistentVolume.csi.volumeHandle.placeholder')" />
      </div>
    </div>
    <div class="row mb-20">
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
          :required="true"
          :mode="mode"
          :title="t('persistentVolume.csi.options.label')"
          :add-label="t('persistentVolume.csi.options.addLabel')"
          :read-allowed="false"
        />
      </div>
    </div>
  </div>
</template>
