<script>
import { get } from '@/utils/object';

import { RANCHER } from '@/config/types';

export default {
  async asyncData(ctx) {
    const { route, store } = ctx;
    const id = get(route, 'params.cluster');

    const cluster = await store.dispatch('management/find', { type: RANCHER.CLUSTER, id });

    return { cluster };
  }
};
</script>

<template>
  <div>
    <h1>
      Cluster: {{ cluster.nameDisplay }}
    </h1>
    <div class="text-center" style="margin-top: 200px;">
      Dashboard...
    </div>
  </div>
</template>
