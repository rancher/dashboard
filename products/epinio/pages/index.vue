<script lang="ts">
import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';
import { BLANK_CLUSTER } from '@/store';
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
