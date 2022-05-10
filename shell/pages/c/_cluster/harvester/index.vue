<script>
import { NAME } from '@shell/config/product/harvester';
import { HCI } from '@shell/config/types';

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
    This is harvester Dashboard.
  </div>
</template>
