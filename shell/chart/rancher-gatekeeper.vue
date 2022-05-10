<script>
import UnitInput from '@shell/components/form/UnitInput';

export default {
  components: { UnitInput },
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
        <UnitInput v-model="value.auditInterval" label="Audit interval" suffix="Seconds" />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <UnitInput v-model="value.constraintViolationsLimit" label="Constraint violations limit" suffix="" />
      </div>
    </div>
  </div>
</template>
