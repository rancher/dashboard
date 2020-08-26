<script>
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/fleet';

export default { middleware: InstallRedirect(NAME, CHART_NAME) };
</script>

<template>
  <div>This is fleet.</div>
</template>
