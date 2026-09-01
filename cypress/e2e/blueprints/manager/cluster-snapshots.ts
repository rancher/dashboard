export function snapshot(clusterId: string, id: string): object {
  return {
    annotations:  { 'lifecycle.cattle.io/create.etcdbackup-controller': 'true' },
    backupConfig: {
      enabled:        true,
      intervalHours:  12,
      retention:      6,
      s3BackupConfig: null,
      safeTimestamp:  false,
      timeout:        300,
      type:           '/v3/schemas/backupConfig'
    },
    baseType:    'etcdBackup',
    clusterId,
    created:     '2024-01-13T20:57:17Z',
    createdTS:   1705179437000,
    creatorId:   null,
    filename:    `${ clusterId }-${ id }_2024-01-13T20:57:17Z.zip`,
    id:          `${ clusterId }:${ clusterId }-${ id }`,
    labels:      { 'cattle.io/creator': 'norman' },
    manual:      true,
    name:        `${ clusterId }-${ id }`,
    namespaceId: null,
  };
}
