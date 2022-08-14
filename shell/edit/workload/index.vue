<script>
import WorkloadDeployment from './types/Deployment';

import WorkLoadMixin from '@shell/edit/workload/mixins/workload';

export default {
  name:       'CruWorkload',
  components: { WorkloadDeployment },
  props:      {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },
  mixins: [WorkLoadMixin],
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <WorkloadDeployment :mode="mode" :value="value" />
  </div>
</template>
