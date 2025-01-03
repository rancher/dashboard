<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';

import { mapGetters } from 'vuex';

export default {
  components: { LabeledInput, Checkbox },
  props:      {
    // volumeAttributes object
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) }
};
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.name"
          :required="true"
          :mode="mode"
          :label="t('workload.storage.volumeName')"
        />
      </div>
      <div class="col span-6">
        <Checkbox
          v-model:value="value.awsElasticBlockStore.readOnly"
          :mode="mode"
          :label="t('workload.storage.readOnly')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.awsElasticBlockStore.volumeID"
          :required="true"
          :mode="mode"
          :label="t('workload.storage.csi.volumeID')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value.number="value.awsElasticBlockStore.partition"
          :mode="mode"
          :label="t('workload.storage.csi.partition')"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.awsElasticBlockStore.fsType"
          :mode="mode"
          :label="t('workload.storage.csi.fsType')"
        />
      </div>
    </div>
  </div>
</template>
