<script>
import { get } from '@/utils/object';
import { TO_FRIENDLY } from '@/config/friendly';
import ExplorerDetail from '@/components/ExplorerDetail';
import RioDetail, { watchQuery } from '@/components/RioDetail';

export default {
  name:       'ExplorerGroupResourceId',
  components: { RioDetail, ExplorerDetail },
  asyncData(ctx) {
    const { route } = ctx;
    const type = get(route, 'params.resource');

    if (TO_FRIENDLY[type]) {
      return import('@/components/RioDetail').then(module => module.asyncData(ctx));
    } else {
      return import('@/components/ExplorerDetail').then(module => module.asyncData(ctx));
    }
  },

  watchQuery,
};
</script>

<template>
  <div>
    <RioDetail v-if="!!model" v-bind="_data" />
    <ExplorerDetail v-else :async-data="_data" />
  </div>
</template>
