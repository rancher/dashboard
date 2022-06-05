import {
  Action, CloneObject, Conditions, CustomValidationRule, MapOfStrings,
  MODES, RehydrateObject, RelatedResource,
  ResourceDetails, ResourceProperties, Selector, STATE_COLOR, STATE_TYPE,
  StateDetails, StateInfoForTypes, StateList, STATES_ENUM
} from './types/rancher-api-types';

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

export const REMAP_STATE: MapOfStrings = {
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

export const DEFAULT_COLOR = 'warning';
export const DEFAULT_ICON = 'x';

export const DEFAULT_WAIT_INTERVAL = 1000;
export const DEFAULT_WAIT_TIMEOUT = 30000;

export type SORT_ORDER_TYPE = {
    [index: string]: number;
}

export const SORT_ORDER: SORT_ORDER_TYPE = {
  error:    1,
  warning:  2,
  info:     3,
  success:  4,
  ready:    5,
  notready:   6,
  other:    7,
};

export const STATES: StateList = {
  [STATES_ENUM.IN_USE]:           {
    color: 'success', icon: 'dot-open', label: 'In Use'
  },
  [STATES_ENUM.IN_PROGRESS]:      {
    color: 'info', icon: 'tag', label: 'In Progress'
  },
  [STATES_ENUM.PENDING_ROLLBACK]: {
    color: 'info', icon: 'dot-half', label: 'Pending Rollback'
  },
  [STATES_ENUM.PENDING_UPGRADE]:  {
    color: 'info', icon: 'dot-half', label: 'Pending Update'
  },
  [STATES_ENUM.ABORTED]:            {
    color: 'warning', icon: 'error', label: 'Aborted'
  },
  [STATES_ENUM.ACTIVATING]:         {
    color: 'info', icon: 'tag', label: 'Activating'
  },
  [STATES_ENUM.ACTIVE]:             {
    color: 'success', icon: 'dot-open', label: 'Active'
  },
  [STATES_ENUM.AVAILABLE]:          {
    color: 'success', icon: 'dot-open', label: 'Available'
  },
  [STATES_ENUM.BACKED_UP]:           {
    color: 'success', icon: 'backup', label: 'Backed Up'
  },
  [STATES_ENUM.BOUND]:              {
    color: 'success', icon: 'dot', label: 'Bound'
  },
  [STATES_ENUM.BUILDING]:           {
    color: 'success', icon: 'dot-open', label: 'Building'
  },
  [STATES_ENUM.COMPLETED]:          {
    color: 'success', icon: 'dot', label: 'Completed'
  },
  [STATES_ENUM.CORDONED]:           {
    color: 'info', icon: 'tag', label: 'Cordoned'
  },
  [STATES_ENUM.COUNT]:              {
    color: 'success', icon: 'dot-open', label: 'Count'
  },
  [STATES_ENUM.CREATED]:            {
    color: 'info', icon: 'tag', label: 'Created'
  },
  [STATES_ENUM.CREATING]:           {
    color: 'info', icon: 'tag', label: 'Creating'
  },
  [STATES_ENUM.DEACTIVATING]:       {
    color: 'info', icon: 'adjust', label: 'Deactivating'
  },
  [STATES_ENUM.DEGRADED]:           {
    color: 'warning', icon: 'error', label: 'Degraded'
  },
  [STATES_ENUM.DENIED]:             {
    color: 'error', icon: 'adjust', label: 'Denied'
  },
  [STATES_ENUM.DEPLOYED]:           {
    color: 'success', icon: 'dot-open', label: 'Deployed'
  },
  [STATES_ENUM.DISABLED]:           {
    color: 'warning', icon: 'error', label: 'Disabled'
  },
  [STATES_ENUM.DISCONNECTED]:       {
    color: 'warning', icon: 'error', label: 'Disconnected'
  },
  [STATES_ENUM.DRAINED]:            {
    color: 'info', icon: 'tag', label: 'Drained'
  },
  [STATES_ENUM.DRAINING]:           {
    color: 'warning', icon: 'tag', label: 'Draining'
  },
  [STATES_ENUM.ERR_APPLIED]:         {
    color: 'error', icon: 'error', label: 'Error Applied'
  },
  [STATES_ENUM.ERROR]:              {
    color: 'error', icon: 'error', label: 'Error'
  },
  [STATES_ENUM.ERRORING]:           {
    color: 'error', icon: 'error', label: 'Erroring'
  },
  [STATES_ENUM.ERRORS]:             {
    color: 'error', icon: 'error', label: 'Errors'
  },
  [STATES_ENUM.EXPIRED]:            {
    color: 'warning', icon: 'error', label: 'Expired'
  },
  [STATES_ENUM.FAIL]:               {
    color: 'error', icon: 'error', label: 'Fail'
  },
  [STATES_ENUM.FAILED]:             {
    color: 'error', icon: 'error', label: 'Failed'
  },
  [STATES_ENUM.HEALTHY]:            {
    color: 'success', icon: 'dot-open', label: 'Healthy'
  },
  [STATES_ENUM.INACTIVE]:           {
    color: 'error', icon: 'dot', label: 'Inactive'
  },
  [STATES_ENUM.INITIALIZING]:       {
    color: 'warning', icon: 'error', label: 'Initializing'
  },
  [STATES_ENUM.INPROGRESS]:         {
    color: 'info', icon: 'spinner', label: 'In Progress'
  },
  [STATES_ENUM.INFO]:         {
    color: 'info', icon: 'info', label: 'Info'
  },
  [STATES_ENUM.LOCKED]:             {
    color: 'warning', icon: 'adjust', label: 'Locked'
  },
  [STATES_ENUM.MIGRATING]:          {
    color: 'info', icon: 'info', label: 'Migrated'
  },
  [STATES_ENUM.MISSING]:            {
    color: 'warning', icon: 'adjust', label: 'Missing'
  },
  [STATES_ENUM.MODIFIED]:           {
    color: 'warning', icon: 'edit', label: 'Modified'
  },
  [STATES_ENUM.NOT_APPLICABLE]:      {
    color: 'warning', icon: 'tag', label: 'Not Applicable'
  },
  [STATES_ENUM.NOT_APLLIED]:         {
    color: 'warning', icon: 'tag', label: 'Not Applied'
  },
  [STATES_ENUM.NOT_READY]:           {
    color: 'warning', icon: 'tag', label: 'Not Ready'
  },
  [STATES_ENUM.OFF]:                {
    color: 'darker', icon: 'error', label: 'Off'
  },
  [STATES_ENUM.ON_GOING]:           {
    color: 'info', icon: 'info', label: 'Info'
  },
  [STATES_ENUM.ORPHANED]:           {
    color: 'warning', icon: 'tag', label: 'Orphaned'
  },
  [STATES_ENUM.OTHER]:              {
    color: 'info', icon: 'info', label: 'Other'
  },
  [STATES_ENUM.OUT_OF_SYNC]:          {
    color: 'warning', icon: 'tag', label: 'Out Of Sync'
  },
  [STATES_ENUM.PASS]:               {
    color: 'success', icon: 'dot-dotfill', label: 'Pass'
  },
  [STATES_ENUM.PASSED]:             {
    color: 'success', icon: 'dot-dotfill', label: 'Passed'
  },
  [STATES_ENUM.PAUSED]:             {
    color: 'info', icon: 'info', label: 'Paused'
  },
  [STATES_ENUM.PENDING]:            {
    color: 'info', icon: 'tag', label: 'Pending'
  },
  [STATES_ENUM.PROVISIONING]:       {
    color: 'info', icon: 'dot', label: 'Provisioning'
  },
  [STATES_ENUM.PROVISIONED]:        {
    color: 'success', icon: 'dot', label: 'Provisioned'
  },
  [STATES_ENUM.PURGED]:             {
    color: 'error', icon: 'purged', label: 'Purged'
  },
  [STATES_ENUM.PURGING]:            {
    color: 'info', icon: 'purged', label: 'Purging'
  },
  [STATES_ENUM.READY]:              {
    color: 'success', icon: 'dot-open', label: 'Ready'
  },
  [STATES_ENUM.RECONNECTING]:       {
    color: 'error', icon: 'error', label: 'Reconnecting'
  },
  [STATES_ENUM.REGISTERING]:        {
    color: 'info', icon: 'tag', label: 'Registering'
  },
  [STATES_ENUM.REINITIALIZING]:     {
    color: 'warning', icon: 'error', label: 'Reinitializing'
  },
  [STATES_ENUM.RELEASED]:           {
    color: 'warning', icon: 'error', label: 'Released'
  },
  [STATES_ENUM.REMOVED]:            {
    color: 'error', icon: 'trash', label: 'Removed'
  },
  [STATES_ENUM.REMOVING]:           {
    color: 'info', icon: 'trash', label: 'Removing'
  },
  [STATES_ENUM.REQUESTED]:          {
    color: 'info', icon: 'tag', label: 'Requested'
  },
  [STATES_ENUM.RESTARTING]:         {
    color: 'info', icon: 'adjust', label: 'Restarting'
  },
  [STATES_ENUM.RESTORING]:          {
    color: 'info', icon: 'medicalcross', label: 'Restoring'
  },
  [STATES_ENUM.RESIZING]:           {
    color: 'warning', icon: 'dot', label: 'Resizing'
  },
  [STATES_ENUM.RUNNING]:            {
    color: 'success', icon: 'dot-open', label: 'Running'
  },
  [STATES_ENUM.SKIP]:               {
    color: 'info', icon: 'dot-open', label: 'Skip'
  },
  [STATES_ENUM.SKIPPED]:            {
    color: 'info', icon: 'dot-open', label: 'Skipped'
  },
  [STATES_ENUM.STARTING]:           {
    color: 'info', icon: 'adjust', label: 'Starting'
  },
  [STATES_ENUM.STOPPED]:            {
    color: 'error', icon: 'dot', label: 'Stopped'
  },
  [STATES_ENUM.STOPPING]:           {
    color: 'info', icon: 'adjust', label: 'Stopping'
  },
  [STATES_ENUM.SUCCEEDED]:          {
    color: 'success', icon: 'dot-dotfill', label: 'Succeeded'
  },
  [STATES_ENUM.SUCCESS]:            {
    color: 'success', icon: 'dot-open', label: 'Success'
  },
  [STATES_ENUM.SUPERSEDED]:         {
    color: 'info', icon: 'dot-open', label: 'Superseded'
  },
  [STATES_ENUM.SUSPENDED]:          {
    color: 'info', icon: 'pause', label: 'Suspended'
  },
  [STATES_ENUM.UNAVAILABLE]:        {
    color: 'error', icon: 'error', label: 'Unavailable'
  },
  [STATES_ENUM.UNHEALTHY]:          {
    color: 'error', icon: 'error', label: 'Unhealthy'
  },
  [STATES_ENUM.UNINSTALLED]:        {
    color: 'info', icon: 'trash', label: 'Uninstalled'
  },
  [STATES_ENUM.UNINSTALLING]:       {
    color: 'info', icon: 'trash', label: 'Uninstalling'
  },
  [STATES_ENUM.UNKNOWN]:            {
    color: 'warning', icon: 'x', label: 'Unknown'
  },
  [STATES_ENUM.UNTRIGGERED]:        {
    color: 'success', icon: 'tag', label: 'Untriggered'
  },
  [STATES_ENUM.UPDATING]:           {
    color: 'warning', icon: 'tag', label: 'Updating'
  },
  [STATES_ENUM.WAIT_APPLIED]:        {
    color: 'info', icon: 'tag', label: 'Wait Applied'
  },
  [STATES_ENUM.WAIT_CHECKIN]:        {
    color: 'warning', icon: 'tag', label: 'Wait Checkin'
  },
  [STATES_ENUM.WAITING]:            {
    color: 'info', icon: 'tag', label: 'Waiting'
  },
  [STATES_ENUM.WARNING]:            {
    color: 'warning', icon: 'error', label: 'Warning'
  },
};
