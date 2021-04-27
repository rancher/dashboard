<script>
import { NAME } from '@/config/product/fleet';
import { FLEET } from '@/config/types';

export default {
  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  NAME,
        resource: FLEET.GIT_REPO,
      }
    });
  }
};

</script>

<template>
  <div>This is Fleet.</div>
</template>
