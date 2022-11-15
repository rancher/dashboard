<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import { _CREATE } from '@shell/config/query-params';

export default {
  components: { LabeledInput, RadioGroup },
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
    const volumeTypeOptions = [
      {
        label: this.t('storageClass.gce-pd.volumeType.standard'),
        value: 'pd-standard'
      },
      {
        label: this.t('storageClass.gce-pd.volumeType.ssd'),
        value: 'pd-ssd'
      }
    ];

    const availabilityZoneOptions = [
      {
        label: this.t('storageClass.gce-pd.availabilityZone.automatic'),
        value: null
      },
      {
        label: this.t('storageClass.gce-pd.availabilityZone.manual'),
        value: 'manual'
      }
    ];
    const replicationTypeOptions = [
      {
        label: this.t('storageClass.gce-pd.replicationType.zonal'),
        value: null
      },
      {
        label: this.t('storageClass.gce-pd.replicationType.regional'),
        value: 'regional-pd'
      }
    ];

    if (this.mode === _CREATE) {
      this.$set(this.value.parameters, 'type', this.value.parameters.type || volumeTypeOptions[0].value);
    }

    return {
      volumeTypeOptions,
      availabilityZoneOptions,
      replicationTypeOptions,

      volumeType:           volumeTypeOptions[0].value,
      availabilityZone:     this.value.parameters.zones ? availabilityZoneOptions[1].value : availabilityZoneOptions[0].value,
      replicationType:      replicationTypeOptions[0].value,
      filesystemType:       '',
      manualfilesystemType: ''
    };
  },
};
</script>
<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="value.parameters.type"
          name="volumeType"
          :label="t('storageClass.gce-pd.volumeType.label')"
          :mode="mode"
          :options="volumeTypeOptions"
        />
        <LabeledInput
          v-model="value.parameters.fsType"
          class="mt-10"
          :placeholder="t('storageClass.gce-pd.filesystemType.placeholder')"
          :label="t('storageClass.gce-pd.filesystemType.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="availabilityZone"
          name="availabilityZone"
          :label="t('storageClass.gce-pd.availabilityZone.label')"
          :mode="mode"
          :options="availabilityZoneOptions"
        />
        <LabeledInput
          v-if="availabilityZone === 'manual'"
          v-model="value.parameters.zones"
          class="mt-10"
          :placeholder="t('storageClass.gce-pd.availabilityZone.placeholder')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model="value.parameters['replication-type']"
          name="replicationType"
          :label="t('storageClass.gce-pd.replicationType.label')"
          :mode="mode"
          :options="replicationTypeOptions"
        />
      </div>
    </div>
  </div>
</template>
