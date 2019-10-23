<script>
import Probe from '@/components/cru/rio.cattle.io.v1.service/Probe';

export default {
  components: { Probe },
  props:      {
    spec: {
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
  <div class="row">
    <div class="col span-6">
      <Probe
        v-model="spec.readinessProbe"
        :mode="mode"
        :for-liveness="false"
        label="Readiness Check"
        description="Containers will be removed from service endpoints when this check is failing.  Recommended."
      />
    </div>
    <div class="col span-6">
      <Probe
        v-model="spec.livenessProbe"
        :mode="mode"
        :for-liveness="true"
        label="Liveness Check"
        description="Containers will be restarted when this check is failing.  Not recommended for most uses."
      />
    </div>
  </div>
</template>
