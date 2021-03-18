<script>
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/manager';
import { CAPI } from '@/config/types';

export default { middleware: [InstallRedirect(NAME, CHART_NAME, CAPI.RANCHER_CLUSTER)] };
</script>

<template>
  <div>This is Fleet.</div>
</template>
