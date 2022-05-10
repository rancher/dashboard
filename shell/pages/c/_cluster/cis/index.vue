<script>
import InstallRedirect from '@shell/utils/install-redirect';
import { NAME, CHART_NAME } from '@shell/config/product/cis';
import { CIS } from '@shell/config/types';

export default { middleware: [InstallRedirect(NAME, CHART_NAME, CIS.CLUSTER_SCAN)] };
</script>

<template>
  <div>This is cis.</div>
</template>
