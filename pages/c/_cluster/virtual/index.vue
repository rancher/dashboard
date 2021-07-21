<script>
import { NAME } from '@/config/product/virtual';
import { HCI } from '@/config/types';

export default {
  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  NAME,
        resource: HCI.DASHBOARD,
      }
    });
  }
};

</script>

<template>
  <div>
    This is Virtual Dashboard.
  </div>
</template>
