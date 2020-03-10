<script>
import { get } from '@/utils/object';

import { MANAGEMENT } from '@/config/types';

export default {
  async asyncData(ctx) {
    const { route, store } = ctx;
    const id = get(route, 'params.cluster');

    const cluster = await store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id });

    return { cluster };
  }
};
</script>

<template>
  <div>
    <h1>
      Cluster: {{ cluster.nameDisplay }}
    </h1>
    <div class="text-center">
      <img src="~assets/images/i-cant-believe-its-not-wheels.png" style="width: 100%" />
    </div>
  </div>
</template>
