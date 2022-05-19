import { DSL } from '@shell/store/type-map';
import { BACKUP_RESTORE } from '@shell/config/types';
import { STATE, NAME as NAME_HEADER, AGE } from '@shell/config/table-headers';

export const NAME = 'backup';
export const CHART_NAME = 'rancher-backup';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    headers
  } = DSL(store, NAME);

  product({
    ifHaveGroup: /^(.*\.)*resources\.cattle\.io$/,
    icon:        'backup-restore',
  });

  weightType(BACKUP_RESTORE.BACKUP, 99, true);
  weightType(BACKUP_RESTORE.RESTORE, 98, true);

  basicType([
    'resources.cattle.io.backup',
    'resources.cattle.io.restore',
  ]);

  headers(BACKUP_RESTORE.BACKUP, [
    { ...STATE, value: 'Status' },
    NAME_HEADER,
    'Location',
    'Type',
    {
      name:     'backupFilename',
      labelKey: 'backupRestoreOperator.backupFilename',
      value:    'status.filename'
    },
    {
      name:      'nextBackup',
      labelKey:  'backupRestoreOperator.nextBackup',
      value:     'status.nextSnapshotAt',
      formatter: 'Date'
    },
    {
      name:      'nextBackup',
      labelKey:  'backupRestoreOperator.lastBackup',
      value:     'status.lastSnapshotTs',
      formatter: 'Date'

    }
  ]);

  headers(BACKUP_RESTORE.RESTORE, [
    { ...STATE, value: 'Status' },
    NAME_HEADER,
    'Backup-Source',
    'Backup-File',
    AGE,
  ]);
}
