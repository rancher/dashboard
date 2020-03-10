<script>
import { MANAGEMENT } from '@/config/types';
import { filterBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';
export default {
  layout: 'plain',

  fetch({ store, redirect }) {
    const all = store.getters['management/all'](MANAGEMENT.CLUSTER);
    const clusters = sortBy(filterBy(all, 'isReady'), 'nameDisplay');

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
