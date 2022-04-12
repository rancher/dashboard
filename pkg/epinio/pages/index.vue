<script lang="ts">
import { createEpinioRoute } from '../utils/custom-routing';
import { BLANK_CLUSTER } from '@shell/store';
export default {
  middleware({ redirect }: any ) {
    return redirect(
      createEpinioRoute(`c-cluster`, { cluster: BLANK_CLUSTER }),
    );
  }
};

</script>

<template>
  <div>
    Cluster Dashboard
  </div>
</template>
