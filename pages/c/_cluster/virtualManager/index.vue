<script>
import { NAME } from '@/config/product/virtual-manager';
import { HCI } from '@/config/types';

export default {
  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  NAME,
        resource: HCI.CLUSTER
      }
    });
  }
};

</script>

<template>
  <div>
    This is virtual Manager.
  </div>
</template>
