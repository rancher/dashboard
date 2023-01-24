<script>
import { NAME } from '@/pkg/harvester-manager/config/harvester-manager';
import { HCI } from '@shell/config/types';

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
    This is harvester Manager.
  </div>
</template>
