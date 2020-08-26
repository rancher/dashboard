<script>
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/backup';

export default { middleware: InstallRedirect(NAME, CHART_NAME) };
</script>

<template>
  <div>This is backup/restore.</div>
</template>
