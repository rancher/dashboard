<script>
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/kubewarden';
import { KUBEWARDEN } from '@/config/types';

export default { middleware: [InstallRedirect(NAME, CHART_NAME, KUBEWARDEN.POLICY_SERVER)] };
</script>

<template>
  <div>This is kubewarden.</div>
</template>
