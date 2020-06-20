<script>
import Probe from '@/components/form/Probe';
import { _VIEW } from '../../config/query-params';

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

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  }
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
        :description="t('workload.container.healthCheck.readinessTip')"
      />
    </div>

    <hr v-if="!isView" class="mt-40 mb-40" />
    <div v-else class="spacer" />

    <div class="row">
      <Probe
        v-model="value.livenessProbe"
        class="col span-12"
        :mode="mode"
        label="Liveness Check"
        :description="t('workload.container.healthCheck.livenessTip')"
      />
    </div>

    <hr v-if="!isView" class="mt-40 mb-40" />
    <div v-else class="spacer" />

    <div class="row">
      <Probe
        v-model="value.startupProbe"
        class="col span-12"
        :mode="mode"
        label="Startup Check"
        :description="t('workload.container.healthCheck.startupTip')"
      />
    </div>
  </div>
</template>
