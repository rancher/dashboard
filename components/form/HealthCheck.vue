<script>
import Probe from '@/components/form/Probe';

export default {
  components: { Probe },
  props:      {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
  },
};
</script>

<template>
  <div>
    <div class="row">
      <Probe
        v-model="value.readinessProbe"
        class="col span-12"
        :mode="mode"
        label="Readiness Check"
        description="Containers will be removed from service endpoints when this check is failing.  Recommended."
      />
    </div>
    <hr />
    <div class="row">
      <Probe
        v-model="value.livenessProbe"
        class="col span-12"
        :mode="mode"
        label="Liveness Check"
        description="Containers will be restarted when this check is failing.  Not recommended for most uses."
      />
    </div>
    <hr />
    <div class="row">
      <Probe
        v-model="value.startupProbe"
        class="col span-12"
        :mode="mode"
        label="Startup Check"
      />
    </div>
  </div>
</template>
