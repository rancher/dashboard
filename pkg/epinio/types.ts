import EpinioAppChartModel from './models/appcharts';
import EpinioApplicationModel from './models/applications';
import EpinioCatalogServiceModel from './models/catalogservices';
import EpinioConfigurationModel from './models/configurations';
import EpinioServiceModel from './models/services';

export const EPINIO_PRODUCT_NAME = 'epinio';

export const EPINIO_MGMT_STORE = 'epiniomgmt';

// // An endpoint with this name is automatically created by the standalone backend
export const EPINIO_STANDALONE_CLUSTER_NAME = 'default';

export const EPINIO_TYPES = {
  // From API
  APP:              'applications',
  APP_CHARTS:       'appcharts',
  NAMESPACE:        'namespaces',
  CONFIGURATION:    'configurations',
  CATALOG_SERVICE:  'catalogservices',
  SERVICE_INSTANCE: 'services',
  // Internal
  DASHBOARD:        'dashboard',
  INSTANCE:         'instance',
  APP_ACTION:       'application-action',
  APP_INSTANCE:     'application-instance',
};

// // https://github.com/epinio/epinio/blob/7eb93b6dc735f8a6db26b8a242ae62a34877014c/pkg/api/core/v1/models/models.go#L96
export const APPLICATION_MANIFEST_SOURCE_TYPE = {
  NONE:      0,
  PATH:      1,
  GIT:       2,
  CONTAINER: 3,
};

// ------------ App Source Info (used within the UI) --------------
export enum APPLICATION_SOURCE_TYPE {
  CONTAINER_URL = 'container_url', // eslint-disable-line no-unused-vars
  ARCHIVE = 'archive', // eslint-disable-line no-unused-vars
  FOLDER = 'folder', // eslint-disable-line no-unused-vars
  GIT_URL = 'git_url', // eslint-disable-line no-unused-vars
  GIT_HUB = 'git_hub', // eslint-disable-line no-unused-vars
  GIT_LAB = 'git_lab', // eslint-disable-line no-unused-vars
}

export interface AppSourceArchive {
  tarball: string,
  fileName: string
}

export interface AppSourceContainer {
  url: string,
}

export interface AppSourceGitUrl {
  url: string,
  branch: string
}

export type GitAPIData = {
  repos: any[],
  branches: any[],
  commits: any[]
}

export interface AppSourceGit {
  usernameOrOrg?: string,
  repo: { id?: string, name: string },
  commit: string,
  branch: { id?: string, name: string },
  url: string,
  sourceData: GitAPIData
}

export interface AppSourceBuilderImage {
  value: string,
  default: boolean,
}

/**
 * Contains information used within a UI session to represent where an application came from
 */
export interface EpinioAppSource {
  type: string // APPLICATION_SOURCE_TYPE,
  archive: AppSourceArchive,
  container: AppSourceContainer,
  git: AppSourceGit,
  gitUrl: AppSourceGitUrl,
  builderImage: AppSourceBuilderImage,
  appChart: string,
}

// ------------ App Env Var Data (persisted as env var) --------------
export const APPLICATION_ENV_VAR = 'EPINIO_APP_DATA';

export type EPINIO_APP_ENV_VAR_GIT = Omit<AppSourceGit, 'sourceData'>;

/**
 * Contains persisted information that provides applications an understanding of where they came from
 */
export interface EPINIO_APP_DATA {
  source: {
    type: APPLICATION_SOURCE_TYPE,
    builderImage: string,
    container_url?: AppSourceContainer, // eslint-disable-line camelcase
    archive?: Omit<AppSourceArchive, 'tarball'>,
    folder?: Omit<AppSourceArchive, 'tarball'>,
    git_url?: AppSourceGitUrl, // eslint-disable-line camelcase
    git_hub?: EPINIO_APP_ENV_VAR_GIT, // eslint-disable-line camelcase
    git_lab?: EPINIO_APP_ENV_VAR_GIT, // eslint-disable-line camelcase
  }
}

// ------------  --------------

export const APPLICATION_ACTION_STATE = {
  SUCCESS: 'success',
  RUNNING: 'running',
  FAIL:    'fail',
  PENDING: 'pending',
};

export const APPLICATION_PARTS = {
  VALUES: 'values',
  CHART:  'chart',
  IMAGE:  'image',
};

// --------------------------------------
// Temporary code until models are typed
interface EpinioMeta {
  name: string,
  namespace?: string,
  createdAt: string,
}

interface EpinioMetaProperty {
  metadata: {
    name: string,
    namespace?: string
    creationTimestamp: string,
  }
}

export interface EpinioApplicationResource {
  configuration: {
    instances: number,
    configurations: string[],
    appchart?: string,
    environment: Map<string, string>,
    routes: string[]
  },
  image_url: string // eslint-disable-line camelcase
  meta: EpinioMeta
  origin: {
    Kind: number,
    git?: {
      repository: string
    }
  }
  stage_id: string // eslint-disable-line camelcase
  status: string
  statusmessage: string
}

export type EpinioApplication = EpinioApplicationResource & EpinioApplicationModel & EpinioMetaProperty;

export interface EpinioApplicationChartResource {
  meta: EpinioMeta,
  description: string,
  helm_chart: string, // eslint-disable-line camelcase
  short_description: string, // eslint-disable-line camelcase
}

export type EpinioAppChart = EpinioApplicationChartResource & EpinioAppChartModel & EpinioMetaProperty;

export interface EpinioHelmRepoResource {
  name: string,
  url: string,
}

export interface EpinioCatalogServiceResource {
  name: string,
  description: string,
  short_description: string, // eslint-disable-line camelcase
  chart: string,
  chartVersion: string,
  appVersion: string,
  helm_repo: EpinioHelmRepoResource, // eslint-disable-line camelcase
  values: string,
}

export type EpinioCatalogService = EpinioCatalogServiceResource & EpinioCatalogServiceModel & EpinioMetaProperty;

export interface EpinioConfigurationResource {
  meta: EpinioMeta
  configuration: {
    user: string,
    details: Map<string, {}>,
    boundapps: string[],
  }
}

export type EpinioConfiguration = EpinioConfigurationResource & EpinioConfigurationModel & EpinioMetaProperty;

export interface EpinioServiceResource {
  meta: EpinioMeta
  boundapps: string[],
  catalog_service: string, // eslint-disable-line camelcase
  catalog_service_version: string, // eslint-disable-line camelcase
  status: string,
}

export type EpinioService = EpinioServiceResource & EpinioServiceModel & EpinioMetaProperty;

export interface EpinioInfo {
  default_builder_image: string, // eslint-disable-line camelcase
  kube_version: string, // eslint-disable-line camelcase
  platform: string, // eslint-disable-line camelcase
  version: string, // eslint-disable-line camelcase
}
