import semver from 'semver';

// Version of the plugin API supported
// here we inject the current shell version that we read in vue.config
export const UI_EXTENSIONS_API_VERSION = process.env.UI_EXTENSIONS_API_VERSION;
export const UI_PLUGIN_HOST_APP = 'rancher-manager';

export const UI_PLUGIN_BASE_URL = '/v1/uiplugins';

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

export const EXTENSIONS_INCOMPATIBILITY_TYPES = {
  UI:             'uiVersion',
  EXTENSIONS_API: 'extensionsApiVersion',
  KUBE:           'kubeVersion',
  HOST:           'host'
};

export const EXTENSIONS_INCOMPATIBILITY_DATA = {
  UI: {
    type:           EXTENSIONS_INCOMPATIBILITY_TYPES.UI,
    cardMessageKey: 'plugins.incompatibleRancherVersion',
    tooltipKey:     'plugins.info.requiresRancherVersion',
  },
  EXTENSIONS_API: {
    type:           EXTENSIONS_INCOMPATIBILITY_TYPES.EXTENSIONS_API,
    cardMessageKey: 'plugins.incompatibleUiExtensionsApiVersion',
    tooltipKey:     'plugins.info.requiresExtensionApiVersion',
  },
  KUBE: {
    type:           EXTENSIONS_INCOMPATIBILITY_TYPES.KUBE,
    cardMessageKey: 'plugins.incompatibleKubeVersion',
    tooltipKey:     'plugins.info.requiresKubeVersion',
  },
  HOST: {
    type:           EXTENSIONS_INCOMPATIBILITY_TYPES.HOST,
    cardMessageKey: 'plugins.incompatibleHost',
    tooltipKey:     'plugins.info.requiresHost',
  }
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

/**
 * Parse the rancher version string
 */
function parseRancherVersion(v) {
  let parsedRancherVersion = semver.coerce(v)?.version;
  const splitArr = parsedRancherVersion.split('.');

  // this is a scenario where we are on a "head" version of some sort... we can't infer the patch version from it
  // so we apply a big patch version number to make sure we follow through with the minor
  if (v.includes('-') && splitArr?.length === 3) {
    parsedRancherVersion = `${ splitArr[0] }.${ splitArr[1] }.999`;
  }

  return parsedRancherVersion;
}

// i18n-uses plugins.error.generic, plugins.error.api, plugins.error.host

/**
 * Whether an extension should be loaded based on the metadata returned by the backend in the UIPlugins resource instance
 * @returns String || Boolean
 */
//
export function shouldNotLoadPlugin(UIPluginResource, rancherVersion, loadedPlugins) {
  if (!UIPluginResource.name || !UIPluginResource.version || !UIPluginResource.endpoint) {
    return 'plugins.error.generic';
  }

  // Extension chart specified a required extension API version
  // we are propagating the annotations in pkg/package.json for any extension
  // inside the "spec.plugin.metadata" property of UIPlugin resource
  const requiredUiExtensionsVersion = UIPluginResource.spec?.plugin?.metadata?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION];
  // semver.coerce will get rid of any suffix on the version numbering (-rc, -head, etc)
  const parsedUiExtensionsApiVersion = semver.coerce(UI_EXTENSIONS_API_VERSION)?.version || UI_EXTENSIONS_API_VERSION;
  const parsedRancherVersion = rancherVersion ? parseRancherVersion(rancherVersion) : '';

  if (requiredUiExtensionsVersion && !semver.satisfies(parsedUiExtensionsApiVersion, requiredUiExtensionsVersion)) {
    return 'plugins.error.api';
  }

  // Host application
  const requiredHost = UIPluginResource.metadata?.[UI_PLUGIN_METADATA.EXTENSIONS_HOST];

  if (requiredHost && requiredHost !== UI_PLUGIN_HOST_APP) {
    return 'plugins.error.host';
  }

  // Rancher version
  if (parsedRancherVersion) {
    const requiredRancherVersion = UIPluginResource.metadata?.[UI_PLUGIN_METADATA.RANCHER_VERSION];

    if (requiredRancherVersion && !semver.satisfies(parsedRancherVersion, requiredRancherVersion)) {
      return 'plugins.error.version';
    }
  }

  // check if a builtin extension has been loaded before - improve developer experience
  const checkLoaded = loadedPlugins.find((p) => p?.name === UIPluginResource?.name);

  if (checkLoaded && checkLoaded.builtin) {
    return 'plugins.error.developerPkg';
  }

  if (UIPluginResource.metadata?.[UI_PLUGIN_LABELS.CATALOG]) {
    return true;
  }

  return false;
}

/**
 * Wether an extension version is available to be installed, based on the annotations present in the Helm chart version
 * backend may not automatically "limit" a particular version but dashboard will disable that version for install with this check
 * @returns Boolean || Object
 */
export function isSupportedChartVersion(versionData, returnObj = false) {
  const { version, rancherVersion, kubeVersion } = versionData;

  // semver.coerce will get rid of any suffix on the version numbering (-rc, -head, etc)
  const parsedRancherVersion = rancherVersion ? parseRancherVersion(rancherVersion) : '';
  const requiredUiVersion = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.UI_VERSION];
  const requiredKubeVersion = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.KUBE_VERSION];
  const versionObj = { ...version };

  // reset compatibility property
  versionObj.isVersionCompatible = true;
  versionObj.versionIncompatibilityData = {};

  // we aren't on a "published" version of Rancher and therefore in a "-head" or similar
  // Backend will NOT block an extension version from being available IF we are on HEAD versions!!
  // we need to enforce that check if we are on a HEAD world
  if (rancherVersion && rancherVersion.includes('-')) {
    const requiredRancherVersion = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.RANCHER_VERSION];

    if (parsedRancherVersion && !semver.satisfies(parsedRancherVersion, requiredRancherVersion)) {
      if (!returnObj) {
        return false;
      }

      versionObj.isVersionCompatible = false;
      versionObj.versionIncompatibilityData = Object.assign({}, EXTENSIONS_INCOMPATIBILITY_DATA.UI);
      versionObj.versionIncompatibilityData.required = requiredRancherVersion;

      return versionObj;
    }
  }

  // check host application
  const requiredHost = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST];

  if (requiredHost && requiredHost !== UI_PLUGIN_HOST_APP) {
    if (!returnObj) {
      return false;
    }

    versionObj.isVersionCompatible = false;
    versionObj.versionIncompatibilityData = Object.assign({}, EXTENSIONS_INCOMPATIBILITY_DATA.HOST);
    versionObj.versionIncompatibilityData.required = requiredHost;

    return versionObj;
  }

  // check "catalog.cattle.io/ui-extensions-version" annotation
  const requiredUiExtensionsApiVersion = version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION];
  const parsedUiExtensionsApiVersion = semver.coerce(UI_EXTENSIONS_API_VERSION)?.version || UI_EXTENSIONS_API_VERSION;

  if (requiredUiExtensionsApiVersion && parsedUiExtensionsApiVersion && !semver.satisfies(parsedUiExtensionsApiVersion, requiredUiExtensionsApiVersion)) {
    if (!returnObj) {
      return false;
    }

    versionObj.isVersionCompatible = false;
    versionObj.versionIncompatibilityData = Object.assign({}, EXTENSIONS_INCOMPATIBILITY_DATA.EXTENSIONS_API);
    versionObj.versionIncompatibilityData.required = requiredUiExtensionsApiVersion;

    return versionObj;
  }

  // check "catalog.cattle.io/ui-version" annotation
  if (requiredUiVersion && parsedRancherVersion && !semver.satisfies(parsedRancherVersion, requiredUiVersion)) {
    if (!returnObj) {
      return false;
    }

    versionObj.isVersionCompatible = false;
    versionObj.versionIncompatibilityData = Object.assign({}, EXTENSIONS_INCOMPATIBILITY_DATA.UI);
    versionObj.versionIncompatibilityData.required = requiredUiVersion;

    return versionObj;
  }

  // check "catalog.cattle.io/kube-version" annotation
  if (kubeVersion && requiredKubeVersion && !semver.satisfies(kubeVersion, requiredKubeVersion)) {
    if (!returnObj) {
      return false;
    }

    versionObj.isVersionCompatible = false;
    versionObj.versionIncompatibilityData = Object.assign({}, EXTENSIONS_INCOMPATIBILITY_DATA.KUBE);
    versionObj.versionIncompatibilityData.required = requiredKubeVersion;

    return versionObj;
  }

  if (returnObj) {
    return versionObj;
  }

  return true;
}

export function isChartVersionHigher(versionA, versionB) {
  return semver.gt(versionA, versionB);
}
