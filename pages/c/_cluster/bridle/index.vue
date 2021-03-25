<script>
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/bridle';
import { CIS } from '@/config/types';

export default { middleware: [InstallRedirect(NAME, CHART_NAME, CIS.CLUSTER_SCAN)] };
</script>

<template>
  <div>This is Bridle.</div>
</template>
