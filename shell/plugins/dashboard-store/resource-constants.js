export const REMAP_STATE = {
  disabled:                 'inactive',
  notapplied:               'Not Applied',
  notready:                 'Not Ready',
  waitapplied:              'Wait Applied',
  outofsync:                'Out of Sync',
  'in-progress':            'In Progress',
  gitupdating:              'Git Updating',
  errapplied:               'Err Applied',
  waitcheckin:              'Wait Check-In',
  off:                      'Disabled',
  waitingforinfrastructure: 'Waiting for Infra',
  waitingfornoderef:        'Waiting for Node Ref'
};

export const SORT_ORDER = {
  error:    1,
  warning:  2,
  info:     3,
  success:  4,
  ready:    5,
  notready: 6,
  other:    7,
};

export const STRING_LIKE_TYPES = [
  'string',
  'date',
  'blob',
  'enum',
  'multiline',
  'masked',
  'password',
  'dnsLabel',
  'hostname',
];
export const DNS_LIKE_TYPES = ['dnsLabel', 'dnsLabelRestricted', 'hostname'];

export const DEFAULT_ICON = 'x';

export const DEFAULT_COLOR = 'warning';

export const DEFAULT_WAIT_INTERVAL = 1000;
export const DEFAULT_WAIT_TMIMEOUT = 30000;

export const STATES_ENUM = {
  IN_USE:           'in-use',
  IN_PROGRESS:      'in-progress',
  PENDING_ROLLBACK: 'pending-rollback',
  PENDING_UPGRADE:  'pending-upgrade',
  ABORTED:          'aborted',
  ACTIVATING:       'activating',
  ACTIVE:           'active',
  AVAILABLE:        'available',
  BACKED_UP:        'backedup',
  BOUND:            'bound',
  BUILDING:         'building',
  COMPLETED:        'completed',
  CORDONED:         'cordoned',
  COUNT:            'count',
  CREATED:          'created',
  CREATING:         'creating',
  DEACTIVATING:     'deactivating',
  DEGRADED:         'degraded',
  DENIED:           'denied',
  DEPLOYED:         'deployed',
  DEPLOYING:        'deploying',
  DISABLED:         'disabled',
  DISCONNECTED:     'disconnected',
  DRAINED:          'drained',
  DRAINING:         'draining',
  ERR_APPLIED:      'errapplied',
  ERROR:            'error',
  ERRORING:         'erroring',
  ERRORS:           'errors',
  EXPIRED:          'expired',
  FAIL:             'fail',
  FAILED:           'failed',
  HEALTHY:          'healthy',
  INACTIVE:         'inactive',
  INFO:             'info',
  INITIALIZING:     'initializing',
  INPROGRESS:       'inprogress',
  LOCKED:           'locked',
  MIGRATING:        'migrating',
  MISSING:          'missing',
  MODIFIED:         'modified',
  NOT_APPLICABLE:   'notApplicable',
  NOT_APLLIED:      'notapplied',
  NOT_READY:        'notready',
  OFF:              'off',
  ORPHANED:         'orphaned',
  OTHER:            'other',
  OUT_OF_SYNC:      'outofsync',
  ON_GOING:         'on-going',
  PASS:             'pass',
  PASSED:           'passed',
  PAUSED:           'paused',
  PENDING:          'pending',
  PROVISIONING:     'provisioning',
  PROVISIONED:      'provisioned',
  PURGED:           'purged',
  PURGING:          'purging',
  READY:            'ready',
  RECONNECTING:     'reconnecting',
  REGISTERING:      'registering',
  REINITIALIZING:   'reinitializing',
  RELEASED:         'released',
  REMOVED:          'removed',
  REMOVING:         'removing',
  REQUESTED:        'requested',
  RESTARTING:       'restarting',
  RESTORING:        'restoring',
  RESIZING:         'resizing',
  RUNNING:          'running',
  SKIP:             'skip',
  SKIPPED:          'skipped',
  STARTING:         'starting',
  STOPPED:          'stopped',
  STOPPING:         'stopping',
  SUCCEEDED:        'succeeded',
  SUCCESS:          'success',
  SUCCESSFUL:       'successful',
  SUPERSEDED:       'superseded',
  SUSPENDED:        'suspended',
  UNAVAILABLE:      'unavailable',
  UNHEALTHY:        'unhealthy',
  UNINSTALLED:      'uninstalled',
  UNINSTALLING:     'uninstalling',
  UNKNOWN:          'unknown',
  UNTRIGGERED:      'untriggered',
  UPDATING:         'updating',
  WAIT_APPLIED:     'waitapplied',
  WAIT_CHECKIN:     'waitcheckin',
  WAITING:          'waiting',
  WARNING:          'warning',
};

export const STATES = {
  [STATES_ENUM.IN_USE]: {
    color: 'success', icon: 'dot-open', label: 'In Use', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.IN_PROGRESS]: {
    color: 'info', icon: 'tag', label: 'In Progress', compoundIcon: 'info'
  },
  [STATES_ENUM.PENDING_ROLLBACK]: {
    color: 'info', icon: 'dot-half', label: 'Pending Rollback', compoundIcon: 'info'
  },
  [STATES_ENUM.PENDING_UPGRADE]: {
    color: 'info', icon: 'dot-half', label: 'Pending Update', compoundIcon: 'info'
  },
  [STATES_ENUM.ABORTED]: {
    color: 'warning', icon: 'error', label: 'Aborted', compoundIcon: 'warning'
  },
  [STATES_ENUM.ACTIVATING]: {
    color: 'info', icon: 'tag', label: 'Activating', compoundIcon: 'info'
  },
  [STATES_ENUM.ACTIVE]: {
    color: 'success', icon: 'dot-open', label: 'Active', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.AVAILABLE]: {
    color: 'success', icon: 'dot-open', label: 'Available', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.BACKED_UP]: {
    color: 'success', icon: 'backup', label: 'Backed Up', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.BOUND]: {
    color: 'success', icon: 'dot', label: 'Bound', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.BUILDING]: {
    color: 'success', icon: 'dot-open', label: 'Building', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.COMPLETED]: {
    color: 'success', icon: 'dot', label: 'Completed', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.CORDONED]: {
    color: 'info', icon: 'tag', label: 'Cordoned', compoundIcon: 'info'
  },
  [STATES_ENUM.COUNT]: {
    color: 'success', icon: 'dot-open', label: 'Count', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.CREATED]: {
    color: 'info', icon: 'tag', label: 'Created', compoundIcon: 'info'
  },
  [STATES_ENUM.CREATING]: {
    color: 'info', icon: 'tag', label: 'Creating', compoundIcon: 'info'
  },
  [STATES_ENUM.DEACTIVATING]: {
    color: 'info', icon: 'adjust', label: 'Deactivating', compoundIcon: 'info'
  },
  [STATES_ENUM.DEGRADED]: {
    color: 'warning', icon: 'error', label: 'Degraded', compoundIcon: 'warning'
  },
  [STATES_ENUM.DENIED]: {
    color: 'error', icon: 'adjust', label: 'Denied', compoundIcon: 'error'
  },
  [STATES_ENUM.DEPLOYED]: {
    color: 'success', icon: 'dot-open', label: 'Deployed', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.DISABLED]: {
    color: 'warning', icon: 'error', label: 'Disabled', compoundIcon: 'warning'
  },
  [STATES_ENUM.DISCONNECTED]: {
    color: 'warning', icon: 'error', label: 'Disconnected', compoundIcon: 'warning'
  },
  [STATES_ENUM.DRAINED]: {
    color: 'info', icon: 'tag', label: 'Drained', compoundIcon: 'info'
  },
  [STATES_ENUM.DRAINING]: {
    color: 'warning', icon: 'tag', label: 'Draining', compoundIcon: 'warning'
  },
  [STATES_ENUM.ERR_APPLIED]: {
    color: 'error', icon: 'error', label: 'Error Applied', compoundIcon: 'error'
  },
  [STATES_ENUM.ERROR]: {
    color: 'error', icon: 'error', label: 'Error', compoundIcon: 'error'
  },
  [STATES_ENUM.ERRORING]: {
    color: 'error', icon: 'error', label: 'Erroring', compoundIcon: 'error'
  },
  [STATES_ENUM.ERRORS]: {
    color: 'error', icon: 'error', label: 'Errors', compoundIcon: 'error'
  },
  [STATES_ENUM.EXPIRED]: {
    color: 'warning', icon: 'error', label: 'Expired', compoundIcon: 'warning'
  },
  [STATES_ENUM.FAIL]: {
    color: 'error', icon: 'error', label: 'Fail', compoundIcon: 'error'
  },
  [STATES_ENUM.FAILED]: {
    color: 'error', icon: 'error', label: 'Failed', compoundIcon: 'error'
  },
  [STATES_ENUM.HEALTHY]: {
    color: 'success', icon: 'dot-open', label: 'Healthy', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.INACTIVE]: {
    color: 'error', icon: 'dot', label: 'Inactive', compoundIcon: 'error'
  },
  [STATES_ENUM.INITIALIZING]: {
    color: 'warning', icon: 'error', label: 'Initializing', compoundIcon: 'warning'
  },
  [STATES_ENUM.INPROGRESS]: {
    color: 'info', icon: 'spinner', label: 'In Progress', compoundIcon: 'info'
  },
  [STATES_ENUM.INFO]: {
    color: 'info', icon: 'info', label: 'Info', compoundIcon: 'info'
  },
  [STATES_ENUM.LOCKED]: {
    color: 'warning', icon: 'adjust', label: 'Locked', compoundIcon: 'warning'
  },
  [STATES_ENUM.MIGRATING]: {
    color: 'info', icon: 'info', label: 'Migrated', compoundIcon: 'info'
  },
  [STATES_ENUM.MISSING]: {
    color: 'warning', icon: 'adjust', label: 'Missing', compoundIcon: 'warning'
  },
  [STATES_ENUM.MODIFIED]: {
    color: 'warning', icon: 'edit', label: 'Modified', compoundIcon: 'warning'
  },
  [STATES_ENUM.NOT_APPLICABLE]: {
    color: 'warning', icon: 'tag', label: 'Not Applicable', compoundIcon: 'warning'
  },
  [STATES_ENUM.NOT_APLLIED]: {
    color: 'warning', icon: 'tag', label: 'Not Applied', compoundIcon: 'warning'
  },
  [STATES_ENUM.NOT_READY]: {
    color: 'warning', icon: 'tag', label: 'Not Ready', compoundIcon: 'warning'
  },
  [STATES_ENUM.OFF]: {
    color: 'darker', icon: 'error', label: 'Off'
  },
  [STATES_ENUM.ON_GOING]: {
    color: 'info', icon: 'info', label: 'Info', compoundIcon: 'info'
  },
  [STATES_ENUM.ORPHANED]: {
    color: 'warning', icon: 'tag', label: 'Orphaned', compoundIcon: 'warning'
  },
  [STATES_ENUM.OTHER]: {
    color: 'info', icon: 'info', label: 'Other', compoundIcon: 'info'
  },
  [STATES_ENUM.OUT_OF_SYNC]: {
    color: 'warning', icon: 'tag', label: 'Out Of Sync', compoundIcon: 'warning'
  },
  [STATES_ENUM.PASS]: {
    color: 'success', icon: 'dot-dotfill', label: 'Pass', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.PASSED]: {
    color: 'success', icon: 'dot-dotfill', label: 'Passed', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.PAUSED]: {
    color: 'info', icon: 'info', label: 'Paused', compoundIcon: 'info'
  },
  [STATES_ENUM.PENDING]: {
    color: 'info', icon: 'tag', label: 'Pending', compoundIcon: 'info'
  },
  [STATES_ENUM.PROVISIONING]: {
    color: 'info', icon: 'dot', label: 'Provisioning', compoundIcon: 'info'
  },
  [STATES_ENUM.PROVISIONED]: {
    color: 'success', icon: 'dot', label: 'Provisioned', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.PURGED]: {
    color: 'error', icon: 'purged', label: 'Purged', compoundIcon: 'error'
  },
  [STATES_ENUM.PURGING]: {
    color: 'info', icon: 'purged', label: 'Purging', compoundIcon: 'info'
  },
  [STATES_ENUM.READY]: {
    color: 'success', icon: 'dot-open', label: 'Ready', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.RECONNECTING]: {
    color: 'error', icon: 'error', label: 'Reconnecting', compoundIcon: 'error'
  },
  [STATES_ENUM.REGISTERING]: {
    color: 'info', icon: 'tag', label: 'Registering', compoundIcon: 'info'
  },
  [STATES_ENUM.REINITIALIZING]: {
    color: 'warning', icon: 'error', label: 'Reinitializing', compoundIcon: 'warning'
  },
  [STATES_ENUM.RELEASED]: {
    color: 'warning', icon: 'error', label: 'Released', compoundIcon: 'warning'
  },
  [STATES_ENUM.REMOVED]: {
    color: 'error', icon: 'trash', label: 'Removed', compoundIcon: 'error'
  },
  [STATES_ENUM.REMOVING]: {
    color: 'info', icon: 'trash', label: 'Removing', compoundIcon: 'info'
  },
  [STATES_ENUM.REQUESTED]: {
    color: 'info', icon: 'tag', label: 'Requested', compoundIcon: 'info'
  },
  [STATES_ENUM.RESTARTING]: {
    color: 'info', icon: 'adjust', label: 'Restarting', compoundIcon: 'info'
  },
  [STATES_ENUM.RESTORING]: {
    color: 'info', icon: 'medicalcross', label: 'Restoring', compoundIcon: 'info'
  },
  [STATES_ENUM.RESIZING]: {
    color: 'warning', icon: 'dot', label: 'Resizing', compoundIcon: 'warning'
  },
  [STATES_ENUM.RUNNING]: {
    color: 'success', icon: 'dot-open', label: 'Running', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.SKIP]: {
    color: 'info', icon: 'dot-open', label: 'Skip', compoundIcon: 'info'
  },
  [STATES_ENUM.SKIPPED]: {
    color: 'info', icon: 'dot-open', label: 'Skipped', compoundIcon: 'info'
  },
  [STATES_ENUM.STARTING]: {
    color: 'info', icon: 'adjust', label: 'Starting', compoundIcon: 'info'
  },
  [STATES_ENUM.STOPPED]: {
    color: 'error', icon: 'dot', label: 'Stopped', compoundIcon: 'error'
  },
  [STATES_ENUM.STOPPING]: {
    color: 'info', icon: 'adjust', label: 'Stopping', compoundIcon: 'info'
  },
  [STATES_ENUM.SUCCEEDED]: {
    color: 'success', icon: 'dot-dotfill', label: 'Succeeded', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.SUCCESS]: {
    color: 'success', icon: 'dot-open', label: 'Success', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.SUCCESSFUL]: {
    color: 'success', icon: 'dot-open', label: 'Successful'
  },
  [STATES_ENUM.SUPERSEDED]: {
    color: 'info', icon: 'dot-open', label: 'Superseded', compoundIcon: 'info'
  },
  [STATES_ENUM.SUSPENDED]: {
    color: 'info', icon: 'pause', label: 'Suspended', compoundIcon: 'info'
  },
  [STATES_ENUM.UNAVAILABLE]: {
    color: 'error', icon: 'error', label: 'Unavailable', compoundIcon: 'error'
  },
  [STATES_ENUM.UNHEALTHY]: {
    color: 'error', icon: 'error', label: 'Unhealthy', compoundIcon: 'error'
  },
  [STATES_ENUM.UNINSTALLED]: {
    color: 'info', icon: 'trash', label: 'Uninstalled', compoundIcon: 'info'
  },
  [STATES_ENUM.UNINSTALLING]: {
    color: 'info', icon: 'trash', label: 'Uninstalling', compoundIcon: 'info'
  },
  [STATES_ENUM.UNKNOWN]: {
    color: 'warning', icon: 'x', label: 'Unknown', compoundIcon: 'warning'
  },
  [STATES_ENUM.UNTRIGGERED]: {
    color: 'success', icon: 'tag', label: 'Untriggered', compoundIcon: 'checkmark'
  },
  [STATES_ENUM.UPDATING]: {
    color: 'warning', icon: 'tag', label: 'Updating', compoundIcon: 'warning'
  },
  [STATES_ENUM.WAIT_APPLIED]: {
    color: 'info', icon: 'tag', label: 'Wait Applied', compoundIcon: 'info'
  },
  [STATES_ENUM.WAIT_CHECKIN]: {
    color: 'warning', icon: 'tag', label: 'Wait Checkin', compoundIcon: 'warning'
  },
  [STATES_ENUM.WAITING]: {
    color: 'info', icon: 'tag', label: 'Waiting', compoundIcon: 'info'
  },
  [STATES_ENUM.WARNING]: {
    color: 'warning', icon: 'error', label: 'Warning', compoundIcon: 'warning'
  },
  [STATES_ENUM.DEPLOYING]: {
    color: 'info', icon: 'info', label: 'Deploying', compoundIcon: 'info'
  },
};
