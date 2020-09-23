<script>
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/rancher-cis-benchmark';
import { CIS } from '@/config/types';

function redirectToScan({ redirect, route }) {
  return redirect({
    name:   'c-cluster-product-resource',
    params: {
      ...route.params,
      product:  'cis',
      resource: CIS.CLUSTER_SCAN
    },
  });
}

export default {
  middleware: [InstallRedirect(NAME, CHART_NAME), redirectToScan]
  // middleware: InstallRedirect(NAME, CHART_NAME),

};
</script>

<template>
  <div>This is cis.</div>
</template>
