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
    Cluster: {{ cluster.nameDisplay }}
    <pre>
        {{ cluster }}
    </pre>
  </div>
</template>
