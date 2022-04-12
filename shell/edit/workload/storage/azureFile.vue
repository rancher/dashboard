<script>
import LabeledInput from '@shell/components/form/LabeledInput';
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
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.azureFile.shareName" :mode="mode" :label="t('workload.storage.csi.shareName')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="value.azureFile.secretName" :mode="mode" :label="t('workload.storage.csi.secretName')" />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.azureFile.fsType" :mode="mode" :label="t('workload.storage.csi.fsType')" />
      </div>
    </div>
  </div>
</template>
