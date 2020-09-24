<script>
import InstallRedirect from '@/utils/install-redirect';
import { NAME, CHART_NAME } from '@/config/product/backup';
import { BACKUP_RESTORE } from '@/config/types';

export default { middleware: [InstallRedirect(NAME, CHART_NAME, BACKUP_RESTORE.BACKUP)] };
</script>

<template>
  <div>This is backup/restore.</div>
</template>
