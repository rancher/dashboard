import { DSL } from '@/store/type-map';
import { BACKUP_RESTORE } from '@/config/types';
import { STATE, NAME as NAME_HEADER, AGE } from '@/config/table-headers';

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
    icon:        'backup',
  });

  weightType(BACKUP_RESTORE.BACKUP, 99, true);
  weightType(BACKUP_RESTORE.RESTORE, 98, true);

  basicType([
    'resources.cattle.io.backup',
    'resources.cattle.io.restore',
  ]);

  headers(BACKUP_RESTORE.BACKUP, [
    STATE,
    'Status',
    NAME_HEADER,
    'Location',
    'Type',
    'Latest-Backup',
    AGE,
  ]);

  headers(BACKUP_RESTORE.RESTORE, [
    STATE,
    'Status',
    NAME_HEADER,
    'Backup-Source',
    'Backup-File',
    AGE,
  ]);
}
