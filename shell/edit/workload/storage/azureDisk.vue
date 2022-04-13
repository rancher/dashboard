<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import RadioGroup from '@shell/components/form/RadioGroup';
import { mapGetters } from 'vuex';

export default {
  components: { LabeledInput, RadioGroup },
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
  computed: { ...mapGetters({ t: 'i18n/t' }) },

  created() {
    if (!this.value.kind) {
      this.$set(this.value, 'kind', 'Shared');
    }
  },

};
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.azureDisk.diskName" :mode="mode" :label="t('workload.storage.csi.diskName')" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model.number="value.azureDisk.diskURI" :mode="mode" :label="t('workload.storage.csi.diskURI')" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <RadioGroup
          v-model="value.azureDisk.kind"
          :mode="mode"
          name="kind"
          :label="t('workload.storage.csi.kind.label')"
          :options="['Dedicated', 'Managed', 'Shared']"
          :labels="[t('workload.storage.csi.kind.options.dedicated'), t('workload.storage.csi.kind.options.managed'), t('workload.storage.csi.kind.options.shared')]"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="value.azureDisk.cachingMode"
          name="cachingMode"
          :mode="mode"
          :label="t('workload.storage.csi.cachingMode.label')"
          :options="['None', 'ReadOnly', 'ReadWrite']"
          :labels="[t('workload.storage.csi.cachingMode.options.none'), t('workload.storage.csi.cachingMode.options.readOnly'), t('workload.storage.csi.cachingMode.options.readWrite')]"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model="value.azureDisk.fsType" :mode="mode" :label="t('workload.storage.csi.fsType')" />
      </div>
    </div>
  </div>
</template>
