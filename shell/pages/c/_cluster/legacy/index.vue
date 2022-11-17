<script>
import { NAME } from '@shell/config/product/multi-cluster-apps';

export default {
  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-legacy-pages-page',
      params: {
        ...route.params,
        cluster: 'local',
        product: NAME,
        page:    'alerts'
      }
    });
  }
};

</script>

<template>
  <div>This is Legacy Apps.</div>
</template>
