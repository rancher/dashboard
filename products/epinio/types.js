export const EPINIO_PRODUCT_NAME = 'epinio';

export const EPINIO_MGMT_STORE = 'epiniomgmt';

export const EPINIO_TYPES = {
  // From API
  APP:        'applications',
  NAMESPACE:      'namespaces',
  SERVICE:    'services',
  // Internal
  INSTANCE:   'instance',
  APP_ACTION: 'application-action'
};

export const APPLICATION_SOURCE_TYPE = {
  CONTAINER_URL: 'container_url',
  ARCHIVE:       'archive'
};

export const APPLICATION_ACTION_STATE = {
  SUCCESS: 'success',
  RUNNING: 'running',
  FAIL:    'fail',
  PENDING:  'pending',
};
