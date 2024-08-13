<script>
import KeyValue from '@shell/components/form/KeyValue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import { _CREATE } from '@shell/config/query-params';
import { LONGHORN_DRIVER } from '@shell/config/types';

export default {
  components: {
    LabeledInput, KeyValue, RadioGroup
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
    const defaultVolumeAttributes = {
      size:                '2Gi',
      numberOfReplicas:    '3',
      staleReplicaTimeout: '20',
      fromBackup:          ''
    };

    if (this.mode === _CREATE) {
      this.value.spec['csi'] = this.value.spec.csi || {};
      this.value.spec.csi['driver'] = LONGHORN_DRIVER;
      this.value.spec.csi['readOnly'] = this.value.spec.csi.readOnly || false;
      this.value.spec.csi['volumeAttributes'] = this.value.spec.csi.volumeAttributes || defaultVolumeAttributes;
    }

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
        <LabeledInput
          v-model:value="value.spec.csi.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.csi.volumeHandle"
          :mode="mode"
          :label="t('persistentVolume.longhorn.volumeHandle.label')"
          :placeholder="t('persistentVolume.longhorn.volumeHandle.placeholder')"
          :required="true"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.csi.readOnly"
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
          v-model:value="value.spec.csi.volumeAttributes"
          :required="true"
          :mode="mode"
          :title="t('persistentVolume.longhorn.options.label')"
          :add-label="t('persistentVolume.longhorn.options.addLabel')"
          :read-allowed="false"
        />
      </div>
    </div>
  </div>
</template>
