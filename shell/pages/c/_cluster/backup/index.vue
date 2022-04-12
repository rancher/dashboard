<script>
import InstallRedirect from '@shell/utils/install-redirect';
import { NAME, CHART_NAME } from '@shell/config/product/backup';
import { BACKUP_RESTORE } from '@shell/config/types';

export default { middleware: [InstallRedirect(NAME, CHART_NAME, BACKUP_RESTORE.BACKUP)] };
</script>

<template>
  <div>This is backup/restore.</div>
</template>
