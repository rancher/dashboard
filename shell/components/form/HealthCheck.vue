<script>
import Probe from '@shell/components/form/Probe';
import { _VIEW } from '@shell/config/query-params';

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
          :label="t('workload.container.healthCheck.readinessProbe')"
          :description="t('workload.container.healthCheck.readinessTip')"
          @update:modelValue="update"
        />
      </div>
    </div>
    <div class="spacer" />

    <div>
      <div class="row">
        <Probe
          v-model="livenessProbe"
          class="col span-12"
          :mode="mode"
          :label="t('workload.container.healthCheck.livenessProbe')"
          :description="t('workload.container.healthCheck.livenessTip')"
          @update:modelValue="update"
        />
      </div>
    </div>
    <div class="spacer" />

    <div class="row">
      <Probe
        v-model="startupProbe"
        class="col span-12"
        :mode="mode"
        :label="t('workload.container.healthCheck.startupProbe')"
        :description="t('workload.container.healthCheck.startupTip')"
        @update:modelValue="update"
      />
    </div>
  </div>
</template>
