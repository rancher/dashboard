import semver from 'semver';

// Version of the plugin API supported
export const UI_PLUGIN_API_VERSION = '1.0.0';

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

// Plugin Metadata properties
const UI_PLUGIN_METADATA_API_VERSION = 'apiVersion';

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

// Should we load a plugin, based on the metadata returned by the backend?
export function shouldLoadPlugin(plugin) {
  if (!plugin.name || !plugin.version || !plugin.endpoint) {
    return false;
  }

  // Plugin specified a required API version
  const requiredAPI = plugin.metadata?.[UI_PLUGIN_METADATA_API_VERSION];

  if (requiredAPI) {
    return semver.satisfies(UI_PLUGIN_API_VERSION, requiredAPI);
  }

  return true;
}
