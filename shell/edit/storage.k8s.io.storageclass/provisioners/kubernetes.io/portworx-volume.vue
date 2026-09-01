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
          v-model:value="value.parameters.fs"
          :placeholder="t('storageClass.portworx-volume.filesystem.placeholder')"
          :label="t('storageClass.portworx-volume.filesystem.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.block_size"
          :placeholder="t('storageClass.portworx-volume.blockSize.placeholder')"
          :label="t('storageClass.portworx-volume.blockSize.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.repl"
          :placeholder="t('storageClass.portworx-volume.repl.placeholder')"
          :label="t('storageClass.portworx-volume.repl.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.io_priority"
          :placeholder="t('storageClass.portworx-volume.ioPriority.placeholder')"
          :label="t('storageClass.portworx-volume.ioPriority.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.snap_interval"
          :placeholder="t('storageClass.portworx-volume.snapshotsInterval.placeholder')"
          :label="t('storageClass.portworx-volume.snapshotsInterval.label')"
          :mode="mode"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.aggregation_level"
          :placeholder="t('storageClass.portworx-volume.aggregationLevel.placeholder')"
          :label="t('storageClass.portworx-volume.aggregationLevel.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.parameters.ephemeral"
          :placeholder="t('storageClass.portworx-volume.ephemeral.placeholder')"
          :label="t('storageClass.portworx-volume.ephemeral.label')"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
