export const EPINIO_PRODUCT_NAME = 'epinio';

export const EPINIO_MGMT_STORE = 'epiniomgmt';

// // An endpoint with this name is automatically created by the standalone backend
export const EPINIO_STANDALONE_CLUSTER_NAME = 'default';

export const EPINIO_TYPES = {
  // From API
  APP:           'applications',
  NAMESPACE:     'namespaces',
  CONFIGURATION: 'configurations',
  // Internal
  INSTANCE:      'instance',
  APP_ACTION:    'application-action',
  APP_INSTANCE:  'application-instance',
};

// // https://github.com/epinio/epinio/blob/7eb93b6dc735f8a6db26b8a242ae62a34877014c/pkg/api/core/v1/models/models.go#L96
export const APPLICATION_MANIFEST_SOURCE_TYPE = {
  NONE:      0,
  PATH:      1,
  GIT:       2,
  CONTAINER: 3,
};

export const APPLICATION_SOURCE_TYPE = {
  CONTAINER_URL: 'container_url',
  ARCHIVE:       'archive',
  FOLDER:        'folder',
  GIT_URL:       'git_url',
};

export const APPLICATION_ACTION_STATE = {
  SUCCESS: 'success',
  RUNNING: 'running',
  FAIL:    'fail',
  PENDING:  'pending',
};
