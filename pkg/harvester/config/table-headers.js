/**
 * Harvester
 */

// image
export const IMAGE_DOWNLOAD_SIZE = {
  name:      'downloadedBytes',
  labelKey:  'tableHeaders.size',
  value:     'downSize',
  sort:      'status.size',
  width:     120
};

export const IMAGE_PROGRESS = {
  name:      'Uploaded',
  labelKey:  'tableHeaders.progress',
  value:     'status.progress',
  sort:      'status.progress',
  formatter: 'ImagePercentageBar',
};

// SSH keys
export const FINGERPRINT = {
  name:      'Fingerprint',
  labelKey:  'tableHeaders.fingerprint',
  value:     'status.fingerPrint',
};

// The column of target volume on snapshot list page
export const SNAPSHOT_TARGET_VOLUME = {
  name:      'TargetVolume',
  labelKey:  'harvester.tableHeaders.snapshotTargetVolume',
  value:     'spec.source.persistentVolumeClaimName',
  sort:      'spec.source.persistentVolumeClaimName',
  formatter: 'SnapshotTargetVolume',
};
