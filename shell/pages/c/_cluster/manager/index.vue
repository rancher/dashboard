<script>
import { NAME } from '@shell/config/product/manager';
import { CAPI } from '@shell/config/types';

export default {
  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  NAME,
        resource: CAPI.RANCHER_CLUSTER
      }
    });
  }
};

</script>

<template>
  <div>This is Cluster Manager.</div>
</template>
