<script>
import UnitInput from '@shell/components/form/UnitInput';
import ChartPsp from '@shell/components/ChartPsp';

export default {
  components: { UnitInput, ChartPsp },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  }
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <UnitInput
          v-model="value.auditInterval"
          label="Audit interval"
          suffix="Seconds"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <UnitInput
          v-model="value.constraintViolationsLimit"
          label="Constraint violations limit"
          suffix="Violations"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <ChartPsp :value="value" />
      </div>
    </div>
  </div>
</template>
