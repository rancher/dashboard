import { isEmpty } from '@shell/utils/object';
import { RETENTION_DEFAULT } from '../shared';

/**
 * Initialize etcd snapshot configuration with default values
 * @param {Object} etcdConfig - The etcd configuration object (rkeConfig.etcd)
 * @param {Object} options - Configuration options
 * @returns {void}
 */
export function initializeEtcdSnapshots(etcdConfig, options = {}) {
  if (!etcdConfig) {
    return {
      disableSnapshots:     false,
      s3:                   null,
      snapshotRetention:    options.retentionDefault || RETENTION_DEFAULT,
      snapshotScheduleCron: options.scheduleCron || '0 */5 * * *',
    };
  }

  // Determine disableSnapshots value if not defined
  if (typeof etcdConfig.disableSnapshots === 'undefined') {
    const disableSnapshots = !etcdConfig.snapshotRetention && !etcdConfig.snapshotScheduleCron;

    etcdConfig.disableSnapshots = disableSnapshots;
  }

  return etcdConfig;
}

/**
 * Check if S3 backup is configured
 * @param {Object} etcdConfig - The etcd configuration object
 * @returns {boolean} - True if S3 backup is configured
 */
export function isS3BackupConfigured(etcdConfig) {
  return !!etcdConfig?.s3?.bucket;
}

/**
 * Handle S3 backup state changes
 * @param {Object} etcdConfig - The etcd configuration object
 * @param {boolean} enabled - Whether S3 backup should be enabled
 * @returns {void}
 */
export function handleS3BackupChange(etcdConfig, enabled) {
  if (!etcdConfig) {
    return;
  }

  if (enabled) {
    // We need to make sure that s3 doesn't already have an existing value
    // otherwise when editing a cluster with s3 defined this will clear s3.
    if (isEmpty(etcdConfig.s3)) {
      etcdConfig.s3 = {};
    }
  } else {
    etcdConfig.s3 = null;
  }
}

/**
 * Get default snapshot configuration
 * @param {Object} options - Configuration options
 * @returns {Object} - Default snapshot configuration
 */
export function getDefaultSnapshotConfig(options = {}) {
  return {
    disableSnapshots:     false,
    s3:                   null,
    snapshotRetention:    options.retentionDefault || RETENTION_DEFAULT,
    snapshotScheduleCron: options.scheduleCron || '0 */5 * * *',
  };
}

/**
 * Validate etcd snapshot configuration
 * @param {Object} etcdConfig - The etcd configuration object
 * @returns {Object} - Validation result with isValid and errors array
 */
export function validateSnapshotConfig(etcdConfig) {
  const errors = [];

  if (!etcdConfig) {
    return { isValid: true, errors };
  }

  // Validate cron expression if snapshots are enabled
  if (!etcdConfig.disableSnapshots) {
    if (!etcdConfig.snapshotScheduleCron) {
      errors.push('snapshotScheduleCron is required when snapshots are enabled');
    }
    if (!etcdConfig.snapshotRetention) {
      errors.push('snapshotRetention is required when snapshots are enabled');
    }
  }

  // Validate S3 configuration if enabled
  if (etcdConfig.s3 && !isEmpty(etcdConfig.s3)) {
    if (!etcdConfig.s3.bucket) {
      errors.push('S3 bucket is required when S3 backup is enabled');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
