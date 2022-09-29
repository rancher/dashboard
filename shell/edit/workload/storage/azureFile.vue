<script>
import { mapGetters } from 'vuex';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput, Checkbox },

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
        <LabeledInput
          v-model="value.name"
          :required="true"
          :mode="mode"
          :label="t('workload.storage.volumeName')"
        />
      </div>
      <div class="col span-6">
        <Checkbox
          v-model="value.azureFile.readOnly"
          :mode="mode"
          :label="t('workload.storage.readOnly')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.azureFile.shareName"
          :mode="mode"
          :required="true"
          :label="t('workload.storage.csi.shareName')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.azureFile.secretName"
          :mode="mode"
          :required="true"
          :label="t('workload.storage.csi.secretName')"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.azureFile.fsType" :mode="mode" :label="t('workload.storage.csi.fsType')" />
      </div>
    </div>
  </div>
</template>
