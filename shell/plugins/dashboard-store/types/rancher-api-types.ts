import Resource from '../resource-class';

export const enum STATE_COLORS {
    info = 'info',
    error = 'error',
    success = 'success',
    warning = 'warning',
    unknown = 'unknown',
    darker = 'darker'
}

export type STATE_COLOR = keyof typeof STATE_COLORS;

export const enum MODES {
    _CREATE = 'create',
    _VIEW = 'view',
    _EDIT = 'edit',
    _CLONE = 'clone',
    _STAGE = 'stage',
    _IMPORT = 'import'
}

export type StateDetails = {
    color: STATE_COLOR;
    icon?: string;
    label?: string;
    transitioning?: boolean;
    error?: boolean;
    message?: string;
}

export type StateInfoForTypes = {
    [key in STATE_COLORS]: string[]
}

export const enum STATES_ENUM {
    IN_USE = 'in-use',
    IN_PROGRESS = 'in-progress',
    PENDING_ROLLBACK = 'pending-rollback',
    PENDING_UPGRADE = 'pending-upgrade',
    ABORTED = 'aborted',
    ACTIVATING = 'activating',
    ACTIVE = 'active',
    AVAILABLE = 'available',
    BACKED_UP = 'backedup',
    BOUND = 'bound',
    BUILDING = 'building',
    COMPLETED = 'completed',
    CORDONED = 'cordoned',
    COUNT = 'count',
    CREATED = 'created',
    CREATING = 'creating',
    DEACTIVATING = 'deactivating',
    DEGRADED = 'degraded',
    DENIED = 'denied',
    DEPLOYED = 'deployed',
    DISABLED = 'disabled',
    DISCONNECTED = 'disconnected',
    DRAINED = 'drained',
    DRAINING = 'draining',
    ERR_APPLIED = 'errapplied',
    ERROR = 'error',
    ERRORING = 'erroring',
    ERRORS = 'errors',
    EXPIRED = 'expired',
    FAIL = 'fail',
    FAILED = 'failed',
    HEALTHY = 'healthy',
    INACTIVE = 'inactive',
    INFO = 'info',
    INITIALIZING = 'initializing',
    INPROGRESS = 'inprogress',
    LOCKED = 'locked',
    MIGRATING = 'migrating',
    MISSING = 'missing',
    MODIFIED = 'modified',
    NOT_APPLICABLE = 'notApplicable',
    NOT_APLLIED = 'notapplied',
    NOT_READY = 'notready',
    OFF = 'off',
    ORPHANED = 'orphaned',
    OTHER = 'other',
    OUT_OF_SYNC = 'outofsync',
    ON_GOING = 'on-going',
    PASS = 'pass',
    PASSED = 'passed',
    PAUSED = 'paused',
    PENDING = 'pending',
    PROVISIONING = 'provisioning',
    PROVISIONED = 'provisioned',
    PURGED = 'purged',
    PURGING = 'purging',
    READY = 'ready',
    RECONNECTING = 'reconnecting',
    REGISTERING = 'registering',
    REINITIALIZING = 'reinitializing',
    RELEASED = 'released',
    REMOVED = 'removed',
    REMOVING = 'removing',
    REQUESTED = 'requested',
    RESTARTING = 'restarting',
    RESTORING = 'restoring',
    RESIZING = 'resizing',
    RUNNING = 'running',
    SKIP = 'skip',
    SKIPPED = 'skipped',
    STARTING = 'starting',
    STOPPED = 'stopped',
    STOPPING = 'stopping',
    SUCCEEDED = 'succeeded',
    SUCCESS = 'success',
    SUPERSEDED = 'superseded',
    SUSPENDED = 'suspended',
    UNAVAILABLE = 'unavailable',
    UNHEALTHY = 'unhealthy',
    UNINSTALLED = 'uninstalled',
    UNINSTALLING = 'uninstalling',
    UNKNOWN = 'unknown',
    UNTRIGGERED = 'untriggered',
    UPDATING = 'updating',
    WAIT_APPLIED = 'waitapplied',
    WAIT_CHECKIN = 'waitcheckin',
    WAITING = 'waiting',
    WARNING = 'warning',
  }

export type StateList = {
    [key in STATES_ENUM]: StateDetails;
}

export type STATE_TYPE = keyof typeof STATES_ENUM;

export type Action = {
    action?: string,
    altAction?: string,
    label?: string,
    icon?: string,
    bulkable?: boolean,
    enabled?: boolean,
    bulkAction?: string,
    weight?: number,
    divider?: boolean
}

export interface MapOfStrings {
    [key: string]: string;
}

export interface MapOfNumbers {
    [key: string]: number;
}

export type Conditions = {
    conditions: string[]
}

export type RehydrateObject = {
    value?: string,
    enumerable?: boolean,
    configurable?: boolean
}

export type CloneObject = {
    value?: boolean,
    enumerable?: boolean,
    configurable?: boolean,
    writable?: boolean
}

export interface ResourceProperties {
    // Allows constructor to work by setting anything in data
    // as a property in the Resource class
    [index: string]: any,
    __clone?: CloneObject,
    __rehydrate?: RehydrateObject,
    state?: string,
    displayName?: string,
    name?: string,
    $getters?: any,
    $rootGetters?: any,
    $dispatch?: any,
    $state?: any,
    $rootState?: any
}

export type CustomValidationRule = {
    nullable?: boolean;
    path?: string;
    requiredIf?: string;
    validators?: string[];
    type?: string;
    translationKey?: string;
}

export type OwnerReferenceContent = {
    key: string;
    row: Resource;
    col: any;
    value?: string;
}
export type ResourceDetails = {
    label?: string;
    formatter?: string;
    content?: OwnerReferenceContent[]
    formatterOpts?: {
        addSuffix?: boolean;
    };
}
