<script>
import { RANCHER } from '@/config/types';
import { filterBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';
export default {
  layout: 'plain',

  fetch({ store, redirect }) {
    const clusters = sortBy(filterBy(store.getters['management/all'](RANCHER.CLUSTER), 'isReady'), 'nameDisplay');

    if ( clusters.length ) {
      redirect(`/c/${ escape(clusters[0].id) }`);
    }
  }
};
</script>

<template>
  <div>
    You don't have any clusters...
  </div>
</template>
