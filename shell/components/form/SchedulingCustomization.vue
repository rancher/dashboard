<script>
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import Banner from '@components/Banner/Banner.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
export default {
  name:       'SchedulingCustomization',
  components: { Checkbox, Banner },
  emits:      ['scheduling-customization-changed'],
  props:      {
    type: {
      type:     String,
      required: true,
    },
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
      :label="t('cluster.agentConfig.subGroups.agentsSchedulingCustomization.label', { agent: type })"
      :description="t('cluster.agentConfig.subGroups.agentsSchedulingCustomization.description', { agent: type })"
      data-testid="scheduling-customization-checkbox"
      @update:value="$emit('scheduling-customization-changed', { event: $event, agentType: type })"
    >
      <template
        v-if="feature && isEdit && settingMissmatch"
        #extra
      >
        <Banner
          class="mt-10 mb-10"
          color="info"
          :label="t('cluster.agentConfig.subGroups.agentsSchedulingCustomization.banner', { agent: type })"
        />
        <Checkbox
          :value="applyGlobal"
          :mode="mode"
          :label="t('cluster.agentConfig.subGroups.agentsSchedulingCustomization.innerCheckbox', { agent: type })"
          @update:value="$emit('scheduling-customization-changed', { event: $event, agentType: type })"
        />
      </template>
    </Checkbox>
  </div>
</template>
