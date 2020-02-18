<script>
import { get } from '@/utils/object';
import { TO_FRIENDLY } from '@/config/friendly';
import ResourceDetail from '@/components/ResourceDetail';
import RioDetail, { watchQuery } from '@/components/RioDetail';

export default {
  name:       'ExplorerGroupResourceId',
  components: { RioDetail, ResourceDetail },
  asyncData(ctx) {
    const { route } = ctx;
    const type = get(route, 'params.resource');

    if (TO_FRIENDLY[type]) {
      return import('@/components/RioDetail').then(module => module.asyncData(ctx));
    } else {
      return import('@/components/ResourceDetail').then(module => module.asyncData(ctx));
    }
  },

  watchQuery,
};
</script>

<template>
  <div>
    <RioDetail v-if="!!model" v-bind="_data" />
    <ResourceDetail v-else :async-data="_data" />
  </div>
</template>
