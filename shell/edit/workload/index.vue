<script>
import WorkloadGeneric from './types/Generic';
import WorkloadDeployment from './types/Deployment';

import WorkLoadMixin from '@shell/edit/workload/mixins/workload';

export default {
  name:       'CruWorkload',
  components: {
    WorkloadGeneric,
    WorkloadDeployment
  },
  props: {
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
    <WorkloadDeployment v-else-if="isDeployment" :mode="mode" :value="value" />
    <WorkloadGeneric v-else :mode="mode" :value="value" />
  </div>
</template>
