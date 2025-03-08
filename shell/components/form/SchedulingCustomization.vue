<script>
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import Banner from '@components/Banner/Banner.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
export default {
  name:       'SchedulingCustomization',
  components: { Checkbox, Banner },
  emits:      ['scheduling-customization-changed'],
  props:      {
    value: {
      type:    Object,
      default: () => {},
    },
    mode: {
      type:    String,
      default: _CREATE
    },
    feature: {
      type:     Boolean,
      required: true
    },
    defaultPC: {
      type:    Object,
      default: () => {},
    },
    defaultPDB: {
      type:    Object,
      default: () => {},
    }
  },
  data() {
    return { applyGlobal: false };
  },
  computed: {
    isEdit() {
      return this.mode === _EDIT;
    },
    enabled() {
      return !!this.value;
    },
    settingMissmatch() {
      const pdbMaxUnavailableMismatch = this.value?.podDisruptionBudget.maxUnavailable !== this.defaultPDB.maxUnavailable;
      const pdbMinAvailableMismatch = this.value?.podDisruptionBudget.minAvailable !== this.defaultPDB.minAvailable;
      const pcValueMismatch = this.value?.priorityClass.value !== this.defaultPC.value;
      const pcPreemptionMismatch = this.value?.priorityClass.preemptionPolicy !== this.defaultPC.preemptionPolicy;
      const pdbMismatch = !!this.value?.podDisruptionBudget && ( pdbMaxUnavailableMismatch || pdbMinAvailableMismatch);
      const pcMismatch = !!this.value?.priorityClass && ( pcValueMismatch || pcPreemptionMismatch);

      return pdbMismatch || pcMismatch;
    },
  }
};
</script>

<template>
  <div
    class="mt-20"
  >
    <Checkbox
      :value="enabled"
      :mode="mode"
      label-key="cluster.agentConfig.subGroups.schedulingCustomization.label"
      descriptionKey="cluster.agentConfig.subGroups.schedulingCustomization.description"
      data-testid="scheduling-customization-checkbox"
      @update:value="$emit('scheduling-customization-changed', $event)"
    >
      <template
        v-if="feature && isEdit && settingMissmatch"
        #extra
      >
        <Banner
          class="mt-10 mb-10"
          color="info"
          label-key="cluster.agentConfig.subGroups.schedulingCustomization.banner"
        />
        <Checkbox
          :value="applyGlobal"
          :mode="mode"
          label-key="cluster.agentConfig.subGroups.schedulingCustomization.innerCheckbox"
          @update:value="$emit('scheduling-customization-changed', feature)"
        />
      </template>
    </Checkbox>
  </div>
</template>
