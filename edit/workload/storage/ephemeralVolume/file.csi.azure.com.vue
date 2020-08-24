<script>
import LabeledInput from '@/components/form/LabeledInput';
import { mapGetters } from 'vuex';

export default {
  components: { LabeledInput },

  props:      {
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

  computed: { ...mapGetters({ t: 'i18n/t' }) },

};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledInput v-model="value.shareName" :mode="mode" :label="t('workload.storage.csi.shareName')" />
    </div>
    <div class="col span-6">
      <LabeledInput v-model="value.secretName" :mode="mode" :label="t('workload.storage.csi.secretName')" />
    </div>
  </div>
</template>
