<script>
import { PRODUCT_NAME } from '../../../types';
import { HCI } from '@shell/config/types';

export default {
  middleware({ redirect, route }) {
    return redirect({
      name:   'harvester-c-cluster-resource',
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
