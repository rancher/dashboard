<script>
import { NAME } from '@/pkg/harvester-manager/config/harvester-manager';
import { HCI } from '@shell/config/types';

export default {
  beforeCreate() {
    this.$router.replace({
      name:   'c-cluster-product-resource',
      params: {
        ...this.$router.currentRoute.params,
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
