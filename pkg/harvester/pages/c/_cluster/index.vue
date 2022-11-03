<script>
import { PRODUCT_NAME } from '../../../config/harvester';
import { HCI } from '../../../types';

export default {
  middleware({ redirect, route }) {
    return redirect({
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        ...route.params,
        product:  PRODUCT_NAME,
        resource: HCI.DASHBOARD
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
