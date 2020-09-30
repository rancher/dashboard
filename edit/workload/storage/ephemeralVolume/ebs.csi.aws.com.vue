<script>
import LabeledInput from '@/components/form/LabeledInput';
import { mapGetters } from 'vuex';

export default {
  components: { LabeledInput },
  props:      {
    // volumeAttribtutes object
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
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.volumeID" :mode="mode" :label="t('workload.storage.csi.volumeID')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model.number="value.parition" :mode="mode" :label="t('workload.storage.csi.partition')" />
      </div>
    </div>
  </div>
</template>
