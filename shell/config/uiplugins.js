import semver from 'semver';

// Version of the plugin API supported
export const UI_PLUGIN_API_VERSION = '1.0.0';
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

// Chart annotations
export const UI_PLUGIN_CHART_ANNOTATIONS = {
  RANCHER_VERSION:    'catalog.cattle.io/rancher-version',
  EXTENSIONS_VERSION: 'catalog.cattle.io/ui-extenstions-version',
  EXTENSIONS_HOST:    'catalog.cattle.io/ui-extenstions-host',
  DISPLAY_NAME:       'catalog.cattle.io/display-name',
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
export function shouldNotLoadPlugin(plugin, rancherVersion) {
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

  return false;
}

// Can a chart version be used for this Rancher (based on the annotations on the chart)?
export function isSupportedChartVersion(chartVersion, rancherVersion) {
  // Plugin specified a required extension API version
  const requiredAPI = chartVersion.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION];

  if (requiredAPI && !semver.satisfies(UI_PLUGIN_API_VERSION, requiredAPI)) {
    return false;
  }

  // Host application
  const requiredHost = chartVersion.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST];

  if (requiredHost && requiredHost !== UI_PLUGIN_HOST_APP) {
    return false;
  }

  // Rancher version
  if (rancherVersion) {
    const requiredRancherVersion = chartVersion.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.RANCHER_VERSION];

    if (requiredRancherVersion && !semver.satisfies(rancherVersion, requiredRancherVersion)) {
      return false;
    }
  }

  return true;
}
