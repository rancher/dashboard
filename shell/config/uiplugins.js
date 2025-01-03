import semver from 'semver';

// Version of the plugin API supported
// here we inject the current shell version that we read in vue.config
export const UI_EXTENSIONS_API_VERSION = process.env.UI_EXTENSIONS_API_VERSION;

export const UI_PLUGIN_HOST_APP = 'rancher-manager';

export const UI_PLUGIN_BASE_URL = '/v1/uiplugins';
export const UI_PLUGIN_NAMESPACE = 'cattle-ui-plugin-system';

// Annotation name and value that indicate a chart is a UI plugin
export const UI_PLUGIN_ANNOTATION = {
  NAME:  'catalog.cattle.io/ui-component',
  VALUE: 'plugins',
};

// Info for the Helm Chart Repositories
export const UI_PLUGINS_REPOS = {
  OFFICIAL: {
    NAME:   'rancher-ui-plugins',
    URL:    'https://github.com/rancher/ui-plugin-charts',
    BRANCH: 'main',
  },
  PARTNERS: {
    NAME:   'partner-extensions',
    URL:    'https://github.com/rancher/partner-extensions',
    BRANCH: 'main',
  },
  COMMUNITY: {
    NAME:   'community-extensions',
    URL:    'https://github.com/rancher/community-extensions',
    BRANCH: 'main',
  },
};

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
  CATALOG:       'catalog.cattle.io/ui-extensions-catalog',
};

export const EXTENSIONS_INCOMPATIBILITY_TYPES = {
  UI:                     'uiVersion',
  EXTENSIONS_API_MISSING: 'extensionsApiVersionMissing',
  EXTENSIONS_API:         'extensionsApiVersion',
  KUBE:                   'kubeVersion',
  HOST:                   'host',
};

export const EXTENSIONS_INCOMPATIBILITY_DATA = {
  UI: {
    type:           EXTENSIONS_INCOMPATIBILITY_TYPES.UI,
    cardMessageKey: 'plugins.incompatibleRancherVersion',
    tooltipKey:     'plugins.info.requiresRancherVersion',
  },
  EXTENSIONS_API_MISSING: {
    type:           EXTENSIONS_INCOMPATIBILITY_TYPES.EXTENSIONS_API_MISSING,
    cardMessageKey: 'plugins.incompatibleUiExtensionsApiVersionMissing',
    tooltipKey:     'plugins.info.requiresExtensionApiVersionMissing',
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
    mainHost:       UI_PLUGIN_HOST_APP,
  },
};

export function isUIPlugin(chart) {
  return !!chart?.versions.find((v) => v.annotations?.[UI_PLUGIN_ANNOTATION.NAME] === UI_PLUGIN_ANNOTATION.VALUE);
}

export function uiPluginHasAnnotation(chart, name, value) {
  return !!chart?.versions.find((v) => v.annotations?.[name] === value);
}

/**
 * Get value of the annotation from the latest version for a chart
 */
export function uiPluginAnnotation(chart, name) {
  return chart?.versions?.[0]?.annotations?.[name];
}

/**
 * Parse the Rancher version string
 */
function parseRancherVersion(v) {
  let parsedVersion = semver.coerce(v)?.version;
  const splitArr = parsedVersion?.split('.');

  // this is a scenario where we are on a "head" version of some sort... we can't infer the patch version from it
  // so we apply a big patch version number to make sure we follow through with the minor
  if (v.includes('-') && splitArr?.length === 3) {
    parsedVersion = `${ splitArr[0] }.${ splitArr[1] }.999`;
  }

  return parsedVersion;
}

/**
 * Check if a version is incompatible with the current environment
 */
function checkIncompatibility(currentVersion, requiredVersion, incompatibilityData, returnObj, versionObj) {
  if ((incompatibilityData.type === EXTENSIONS_INCOMPATIBILITY_TYPES.EXTENSIONS_API_MISSING && !requiredVersion) || (requiredVersion && !semver.satisfies(currentVersion, requiredVersion))) {
    if (!returnObj) {
      return false;
    }
    versionObj.isVersionCompatible = false;
    versionObj.versionIncompatibilityData = { ...incompatibilityData, required: requiredVersion };

    return versionObj;
  }

  return true;
}

// i18n-uses plugins.error.generic, plugins.error.api, plugins.error.host, plugins.error.kubeVersion, plugins.error.version, plugins.error.developerPkg, plugins.error.apiAnnotationMissing

/**
 * Whether an extension should be loaded based on the metadata returned by the backend in the UIPlugins resource instance
 * The output will be used to PREVENT loading of an extension that is already installed but isn't compatible with the system
 *
 * String output will display a message on the extension card to notify users on why the extension was not loaded
 *
 * @returns String | Boolean
 */
export function shouldNotLoadPlugin(UIPluginResource, { rancherVersion, kubeVersion }, loadedPlugins) {
  if (!UIPluginResource.name || !UIPluginResource.version || !UIPluginResource.endpoint) {
    return 'plugins.error.generic';
  }

  // Extension chart specified a required extension API version
  // we are propagating the annotations in pkg/package.json for any extension
  // inside the "spec.plugin.metadata" property of UIPlugin resource
  const requiredUiExtensionsVersion = UIPluginResource.metadata?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION];
  // semver.coerce will get rid of any suffix on the version numbering (-rc, -head, etc)
  const parsedUiExtensionsApiVersion = semver.coerce(UI_EXTENSIONS_API_VERSION)?.version;
  const parsedRancherVersion = rancherVersion ? parseRancherVersion(rancherVersion) : '';
  const parsedKubeVersion = kubeVersion ? semver.coerce(kubeVersion)?.version : '';

  if (!requiredUiExtensionsVersion) {
    return 'plugins.error.apiAnnotationMissing';
  } else if (requiredUiExtensionsVersion && !semver.satisfies(parsedUiExtensionsApiVersion, requiredUiExtensionsVersion)) {
    return 'plugins.error.api';
  }

  // Host application
  const requiredHost = UIPluginResource.metadata?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST];

  if (requiredHost && requiredHost !== UI_PLUGIN_HOST_APP) {
    return 'plugins.error.host';
  }

  // Kube version
  if (parsedKubeVersion) {
    const requiredKubeVersion = UIPluginResource.metadata?.[UI_PLUGIN_CHART_ANNOTATIONS.KUBE_VERSION];

    if (requiredKubeVersion && !semver.satisfies(parsedKubeVersion, requiredKubeVersion)) {
      return 'plugins.error.kubeVersion';
    }
  }

  // Rancher version
  if (parsedRancherVersion) {
    const requiredRancherVersion = UIPluginResource.metadata?.[UI_PLUGIN_CHART_ANNOTATIONS.RANCHER_VERSION];

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
 *
 * The output will be used to display a message on the extension card to notify users if a LATEST version of an extension is available but isn't compatible (cardMessageKey)
 * The output will also disable the buttons in the slide-in panel with extension details, displaying a tooltip message with the reason (tooltipKey)
 *
 * @returns Boolean | Object
 */
export function isSupportedChartVersion(versionData, returnObj = false) {
  const { version, rancherVersion, kubeVersion } = versionData;
  const versionObj = {
    ...version, isVersionCompatible: true, versionIncompatibilityData: {}
  };
  const parsedRancherVersion = rancherVersion ? parseRancherVersion(rancherVersion) : '';
  const parsedUiExtensionsApiVersion = semver.coerce(UI_EXTENSIONS_API_VERSION)?.version;

  const checks = [
    {
      currentVersion:      kubeVersion,
      requiredVersion:     version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.KUBE_VERSION],
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.KUBE,
    },
    {
      currentVersion:      parsedRancherVersion,
      requiredVersion:     version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.RANCHER_VERSION],
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.UI,
    },
    {
      currentVersion:      parsedRancherVersion,
      requiredVersion:     version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.UI_VERSION],
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.UI,
    },
    {
      currentVersion:      parsedUiExtensionsApiVersion,
      requiredVersion:     version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION],
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.EXTENSIONS_API_MISSING,
    },
    {
      currentVersion:      parsedUiExtensionsApiVersion,
      requiredVersion:     version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION],
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.EXTENSIONS_API,
    },
    {
      currentVersion:      UI_PLUGIN_HOST_APP,
      requiredVersion:     version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST],
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.HOST,
    },
  ];

  for (const { currentVersion, requiredVersion, incompatibilityData } of checks) {
    const result = checkIncompatibility(currentVersion, requiredVersion, incompatibilityData, returnObj, versionObj);

    if (result !== true) {
      return result;
    }
  }

  return returnObj ? versionObj : true;
}

export function isChartVersionHigher(versionA, versionB) {
  return semver.gt(versionA, versionB);
}
