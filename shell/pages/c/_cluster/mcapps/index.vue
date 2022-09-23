<script>
import { NAME } from '@shell/config/product/multi-cluster-apps';

export default {
  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-mcapps-pages-page',
      params: {
        ...route.params,
        product:  NAME,
        page:    'catalogs'
      }
    });
  }
};

</script>

<template>
  <div>This is Multi-cluster Apps.</div>
</template>
