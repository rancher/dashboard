<script>
import Probe from '@/components/form/Probe';
import { _VIEW } from '@/config/query-params';

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

  data() {
    const { readinessProbe, livenessProbe, startupProbe } = this.value;

    return {
      readinessProbe, livenessProbe, startupProbe
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },
  methods: {
    update() {
      const { readinessProbe, livenessProbe, startupProbe } = this;

      this.$emit('input', {
        readinessProbe, livenessProbe, startupProbe
      } );
    }
  }
};
</script>

<template>
  <div>
    <div>
      <div class="row">
        <Probe
          v-model="readinessProbe"
          class="col span-12"
          :mode="mode"
          label="Readiness Check"
          :description="t('workload.container.healthCheck.readinessTip')"
          @input="update"
        />
      </div>
    </div>
    <hr class="section-divider" />

    <div>
      <div class="row">
        <Probe
          v-model="livenessProbe"
          class="col span-12"
          :mode="mode"
          label="Liveness Check"
          :description="t('workload.container.healthCheck.livenessTip')"
          @input="update"
        />
      </div>
    </div>
    <hr class="section-divider" />

    <div class="row">
      <Probe
        v-model="startupProbe"
        class="col span-12"
        :mode="mode"
        label="Startup Check"
        :description="t('workload.container.healthCheck.startupTip')"
        @input="update"
      />
    </div>
  </div>
</template>
