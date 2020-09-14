<script>
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/backup';
import { BACKUP_RESTORE } from '@/config/types';

function redirectToBackup({ redirect, route }) {
  return redirect({
    name:   'c-cluster-product-resource',
    params: {
      ...route.params,
      resource: BACKUP_RESTORE.BACKUP
    },
  });
}

export default { middleware: [InstallRedirect(NAME, CHART_NAME), redirectToBackup] };
</script>

<template>
  <div>This is backup/restore.</div>
</template>
