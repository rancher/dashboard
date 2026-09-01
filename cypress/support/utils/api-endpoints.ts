/**
 * Base API endpoint for cluster repository management
 */
export const CLUSTER_REPOS_BASE_URL = '/v1/catalog.cattle.io.clusterrepos';

/**
 * Base API endpoint for cluster apps
 */
export const CLUSTER_APPS_BASE_URL = '/v1/catalog.cattle.io.apps';

/**
 * Base API endpoint for users
 */
export const USERS_BASE_URL = '/v1/management.cattle.io.users';

/**
 * When making quick sequential API requests delay by this amount. This should be used as little and infrequently as possible
 */
export const MEDIUM_API_DELAY = 500;
