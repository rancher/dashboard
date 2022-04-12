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
        <LabeledInput v-model="value.gcePersistentDisk.pdName" :mode="mode" :label="t('workload.storage.csi.pdName')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model.number="value.gcePersistentDisk.partition" :mode="mode" :label="t('workload.storage.csi.partition')" />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.gcePersistentDisk.fsType" :mode="mode" :label="t('workload.storage.csi.fsType')" />
      </div>
    </div>
  </div>
</template>
