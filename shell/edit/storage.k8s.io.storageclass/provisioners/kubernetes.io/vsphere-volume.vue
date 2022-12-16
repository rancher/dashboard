<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE } from '@shell/config/query-params';

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
    const diskFormatOptions = [
      {
        label: this.t('storageClass.vsphere-volume.diskFormat.thin'),
        value: 'thin'
      },
      {
        label: this.t('storageClass.vsphere-volume.diskFormat.zeroedthick'),
        value: 'zeroedthick'
      },
      {
        label: this.t('storageClass.vsphere-volume.diskFormat.eagerzeroedthick'),
        value: 'eagerzeroedthick'
      },
    ];

    if (this.mode === _CREATE) {
      this.$set(this.value.parameters, 'diskformat', this.value.parameters.diskformat || diskFormatOptions[0].value);
    }

    return { diskFormatOptions };
  },
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledSelect
          v-model="value.parameters.diskformat"
          :options="diskFormatOptions"
          :label="t('storageClass.vsphere-volume.diskFormat.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.storagePolicyName"
          :placeholder="t('storageClass.vsphere-volume.storagePolicyName.placeholder')"
          :label="t('storageClass.vsphere-volume.storagePolicyName.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.datastore"
          :placeholder="t('storageClass.vsphere-volume.datastore.placeholder')"
          :label="t('storageClass.vsphere-volume.datastore.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.hostFailuresToTolerate"
          :placeholder="t('storageClass.vsphere-volume.hostFailuresToTolerate.placeholder')"
          :label="t('storageClass.vsphere-volume.hostFailuresToTolerate.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.cachereservation"
          :placeholder="t('storageClass.vsphere-volume.cacheReservation.placeholder')"
          :label="t('storageClass.vsphere-volume.cacheReservation.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="value.parameters.fstype"
          :placeholder="t('storageClass.vsphere-volume.filesystemType.placeholder')"
          :label="t('storageClass.vsphere-volume.filesystemType.label')"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
