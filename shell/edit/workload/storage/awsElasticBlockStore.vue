<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import { mapGetters } from 'vuex';

export default {
  components: { LabeledInput },
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
        <LabeledInput v-model="value.awsElasticBlockStore.volumeID" :mode="mode" :label="t('workload.storage.csi.volumeID')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model.number="value.awsElasticBlockStore.partition" :mode="mode" :label="t('workload.storage.csi.partition')" />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.awsElasticBlockStore.fsType" :mode="mode" :label="t('workload.storage.csi.fsType')" />
      </div>
    </div>
  </div>
</template>
