<script>
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/fleet';
import { FLEET } from '@/config/types';

export default { middleware: [InstallRedirect(NAME, CHART_NAME, FLEET.GIT_REPO)] };
</script>

<template>
  <div>This is Fleet.</div>
</template>
