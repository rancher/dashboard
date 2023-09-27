import semver from 'semver';

// Version of the plugin API supported
export const UI_PLUGIN_API_VERSION = '1.1.0';
export const UI_PLUGIN_HOST_APP = 'rancher-manager';

export const UI_PLUGIN_BASE_URL = '/api/v1/namespaces/cattle-ui-plugin-system/services/http:ui-plugin-operator:80/proxy';

export const UI_PLUGIN_NAMESPACE = 'cattle-ui-plugin-system';

// Annotation name and value that indicate a chart is a UI plugin
export const UI_PLUGIN_ANNOTATION_NAME = 'catalog.cattle.io/ui-component';
export const UI_PLUGIN_ANNOTATION_VALUE = 'plugins';

export const UI_PLUGIN_OPERATOR_CRD_CHART_NAME = 'ui-plugin-operator-crd';
export const UI_PLUGIN_OPERATOR_CHART_NAME = 'ui-plugin-operator';

export const UI_PLUGIN_CHARTS = [
  UI_PLUGIN_OPERATOR_CHART_NAME,
  UI_PLUGIN_OPERATOR_CRD_CHART_NAME,
];

// Expected chart repo name for the UI Plugins operator
export const UI_PLUGIN_OPERATOR_REPO_NAME = 'rancher-charts';

// Info for the Helm Chart Repository that we will add
export const UI_PLUGINS_REPO_NAME = 'rancher-ui-plugins';

export const UI_PLUGINS_REPO_URL = 'https://github.com/rancher/ui-plugin-charts';
export const UI_PLUGINS_REPO_BRANCH = 'main';

// Info for the Helm Chart Repo for Partner Extensions
export const UI_PLUGINS_PARTNERS_REPO_NAME = 'partner-extensions';

export const UI_PLUGINS_PARTNERS_REPO_URL = 'https://github.com/rancher/partner-extensions';
export const UI_PLUGINS_PARTNERS_REPO_BRANCH = 'main';

// Info for the Helm Chart Repo for Community Extensions
export const UI_PLUGINS_COMMUNITY_REPO_NAME = 'community-extensions';

export const UI_PLUGINS_COMMUNITY_REPO_URL = 'https://github.com/rancher/community-extensions';
export const UI_PLUGINS_COMMUNITY_REPO_BRANCH = 'main';

// Chart annotations
export const UI_PLUGIN_CHART_ANNOTATIONS = {
  KUBE_VERSION:       'catalog.cattle.io/kube-version',
  RANCHER_VERSION:    'catalog.cattle.io/rancher-version',
  EXTENSIONS_VERSION: 'catalog.cattle.io/ui-extensions-version',
  UI_VERSION:         'catalog.cattle.io/ui-version',
  EXTENSIONS_HOST:    'catalog.cattle.io/ui-extensions-host',
  DISPLAY_NAME:       'catalog.cattle.io/display-name',
  HIDDEN_BUILTIN:     'catalog.cattle.io/ui-hidden-builtin',
};

// Extension catalog labels
export const UI_PLUGIN_LABELS = {
  CATALOG_IMAGE: 'catalog.cattle.io/ui-extensions-catalog-image',
  REPOSITORY:    'catalog.cattle.io/ui-extensions-repository',
  CATALOG:       'catalog.cattle.io/ui-extensions-catalog'
};

// Plugin Metadata properties
export const UI_PLUGIN_METADATA = {
  RANCHER_VERSION:   'rancherVersion',
  EXTENSION_VERSION: 'extVersion',
  EXTENSIONS_HOST:   'host',
  DISPLAY_NAME:      'displayName',
};

export function isUIPlugin(chart) {
  return !!chart?.versions.find((v) => {
    return v.annotations && v.annotations[UI_PLUGIN_ANNOTATION_NAME] === UI_PLUGIN_ANNOTATION_VALUE;
  });
}

export function uiPluginHasAnnotation(chart, name, value) {
  return !!chart?.versions.find((v) => {
    return v.annotations && v.annotations[name] === value;
  });
}

/**
 * Get value of the annotation from teh latest version for a chart
 */
export function uiPluginAnnotation(chart, name) {
  if (chart?.versions?.length > 0) {
    return chart.versions[0].annotations?.[name];
  }

  return undefined;
}

// Should we load a plugin, based on the metadata returned by the backend?
// Returns error key string or false
export function shouldNotLoadPlugin(plugin, rancherVersion, loadedPlugins) {
  if (!plugin.name || !plugin.version || !plugin.endpoint) {
    return 'plugins.error.generic';
  }

  // Plugin specified a required extension API version
  const requiredAPI = plugin.metadata?.[UI_PLUGIN_METADATA.EXTENSION_VERSION];

  if (requiredAPI && !semver.satisfies(UI_PLUGIN_API_VERSION, requiredAPI)) {
    return 'plugins.error.api';
  }

  // Host application
  const requiredHost = plugin.metadata?.[UI_PLUGIN_METADATA.EXTENSIONS_HOST];

  if (requiredHost && requiredHost !== UI_PLUGIN_HOST_APP) {
    return 'plugins.error.host';
  }

  // Rancher version
  if (rancherVersion) {
    const requiredRancherVersion = plugin.metadata?.[UI_PLUGIN_METADATA.RANCHER_VERSION];

    if (requiredRancherVersion && !semver.satisfies(rancherVersion, requiredRancherVersion)) {
      return 'plugins.error.version';
    }
  }

  // check if a builtin extension has been loaded before - improve developer experience
  const checkLoaded = loadedPlugins.find((p) => p?.name === plugin?.name);

  if (checkLoaded && checkLoaded.builtin) {
    return 'plugins.error.developerPkg';
  }

  if (plugin.metadata?.[UI_PLUGIN_LABELS.CATALOG]) {
    return true;
  }

  return false;
}

// Can a chart version be used for this Rancher (based on the annotations on the chart)?
export function isSupportedChartVersion(versionsData) {
  const { version, rancherVersion, kubeVersion } = versionsData;

  // Plugin specified a required extension API version
  const requiredAPI = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION];

  if (requiredAPI && !semver.satisfies(UI_PLUGIN_API_VERSION, requiredAPI)) {
    return false;
  }

  // Host application
  const requiredHost = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST];

  if (requiredHost && requiredHost !== UI_PLUGIN_HOST_APP) {
    return false;
  }

  // Rancher version
  if (rancherVersion) {
    const requiredRancherVersion = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.RANCHER_VERSION];

    if (requiredRancherVersion && !semver.satisfies(rancherVersion, requiredRancherVersion)) {
      return false;
    }
  }

  // Kube version
  if (kubeVersion) {
    const requiredKubeVersion = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.KUBE_VERSION];

    if (requiredKubeVersion && !semver.satisfies(kubeVersion, requiredKubeVersion)) {
      return false;
    }
  }

  return true;
}

export function isChartVersionAvailableForInstall(versionsData, returnObj = false) {
  const { version, rancherVersion, kubeVersion } = versionsData;

  const parsedRancherVersion = rancherVersion.split('-')?.[0];
  const regexHashString = new RegExp('^[A-Za-z0-9]{9}$');
  const isRancherVersionHashString = regexHashString.test(rancherVersion);
  const requiredUiVersion = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.UI_VERSION];
  const requiredKubeVersion = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.KUBE_VERSION];
  const versionObj = { ...version };

  versionObj.isCompatibleWithUi = true;
  versionObj.isCompatibleWithKubeVersion = true;

  // if it's a head version of Rancher, then we skip the validation and enable them all
  if (!isRancherVersionHashString && requiredUiVersion && !semver.satisfies(parsedRancherVersion, requiredUiVersion)) {
    if (!returnObj) {
      return false;
    }
    versionObj.isCompatibleWithUi = false;
    versionObj.requiredUiVersion = requiredUiVersion;

    if (returnObj) {
      return versionObj;
    }
  }

  // check kube version
  if (kubeVersion && requiredKubeVersion && !semver.satisfies(kubeVersion, requiredKubeVersion)) {
    if (!returnObj) {
      return false;
    }
    versionObj.isCompatibleWithKubeVersion = false;
    versionObj.requiredKubeVersion = requiredKubeVersion;

    if (returnObj) {
      return versionObj;
    }
  }

  if (returnObj) {
    return versionObj;
  }

  return true;
}

export function isChartVersionHigher(versionA, versionB) {
  return semver.gt(versionA, versionB);
}
