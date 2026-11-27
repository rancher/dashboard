import semver from 'semver';
import { isRancherPrime } from '@shell/config/version';

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
  SHELL_VERSION:      'catalog.cattle.io/ui-shell-version',
  UI_VERSION:         'catalog.cattle.io/ui-version',
  EXTENSIONS_HOST:    'catalog.cattle.io/ui-extensions-host',
  DISPLAY_NAME:       'catalog.cattle.io/display-name',
  HIDDEN_BUILTIN:     'catalog.cattle.io/ui-hidden-builtin',
  PRIME_ONLY:         'catalog.cattle.io/prime-only'
};

// Keys written into a UIPlugin CR's `spec.plugin.metadata`.
//
// Unlike UI_PLUGIN_CHART_ANNOTATIONS, which are read off the catalog chart, these come
// from the installed CR and so are only available once an extension is installed.
export const UI_PLUGIN_METADATA = {
  // Set on every member of a bundle (umbrella chart) to the name of the bundle's chart,
  // which is also its Helm release name. Absent on standalone extensions.
  BUNDLE: 'catalog.cattle.io/ui-extensions-bundle',
};

// Chart annotation listing a bundle's members, comma separated. Unlike
// UI_PLUGIN_METADATA.BUNDLE this is readable before anything is installed, which is
// what lets the Extensions screen spot a conflict ahead of time.
export const UI_PLUGIN_BUNDLE_MEMBERS_ANNOTATION = 'catalog.cattle.io/ui-extensions-bundle-members';

// Extension catalog labels
export const UI_PLUGIN_LABELS = {
  CATALOG_IMAGE: 'catalog.cattle.io/ui-extensions-catalog-image',
  REPOSITORY:    'catalog.cattle.io/ui-extensions-repository',
  CATALOG:       'catalog.cattle.io/ui-extensions-catalog',
};

export const EXTENSIONS_INCOMPATIBILITY_TYPES = {
  UI:                     'uiVersion',
  // Deprecated from 2.17, superseded by SHELL. Kept because they are part of the published
  // Shell API; removing them belongs to the epic's phase two.
  EXTENSIONS_API_MISSING: 'extensionsApiVersionMissing',
  EXTENSIONS_API:         'extensionsApiVersion',
  SHELL_MISSING:          'shellVersionMissing',
  SHELL:                  'shellVersion',
  KUBE:                   'kubeVersion',
  HOST:                   'host',
  PRIME_ONLY:             'primeOnly',
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
  SHELL_MISSING: {
    type:           EXTENSIONS_INCOMPATIBILITY_TYPES.SHELL_MISSING,
    cardMessageKey: 'plugins.incompatibleShellVersionMissing',
    tooltipKey:     'plugins.info.requiresShellVersionMissing',
  },
  SHELL: {
    type:           EXTENSIONS_INCOMPATIBILITY_TYPES.SHELL,
    cardMessageKey: 'plugins.incompatibleShellVersion',
    tooltipKey:     'plugins.info.requiresShellVersion',
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
  PRIME_ONLY: {
    type:           EXTENSIONS_INCOMPATIBILITY_TYPES.PRIME_ONLY,
    cardMessageKey: 'plugins.incompatiblePrimeOnly',
    tooltipKey:     'plugins.info.requiresRancherPrime',
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

// The Shell range assumed for an extension that predates `ui-shell-version` but still carries
// the retired `ui-extensions-version`. Those were all built against Shell 3.x, so we read them
// as supporting the first three lines of the new scheme rather than refusing them outright.
export const INFERRED_SHELL_VERSION_RANGE = '>= 217.0.0 < 220.0.0';

/**
 * The Shell range an extension requires.
 *
 * `ui-shell-version` is the annotation from Rancher 2.17 onwards and is mandatory. An extension
 * published before it exists has no way to declare one, so the presence of the retired
 * `ui-extensions-version` is taken as a declaration of the inferred range above. An extension
 * carrying neither says nothing about what it supports, and is refused.
 *
 * @returns String | undefined
 */
export function requiredShellVersion(annotations) {
  const declared = annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.SHELL_VERSION];

  if (declared) {
    return declared;
  }

  return annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION] ? INFERRED_SHELL_VERSION_RANGE : undefined;
}

/**
 * Parse the Rancher version string
 */
export function parseRancherVersion(v) {
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
  let passed = true;

  switch (incompatibilityData.type) {
  case EXTENSIONS_INCOMPATIBILITY_TYPES.PRIME_ONLY:
    if (requiredVersion && !currentVersion) {
      passed = false;
    }
    break;
  case EXTENSIONS_INCOMPATIBILITY_TYPES.EXTENSIONS_API_MISSING:
  case EXTENSIONS_INCOMPATIBILITY_TYPES.SHELL_MISSING:
    !requiredVersion ? passed = false : passed = true;
    break;
  case EXTENSIONS_INCOMPATIBILITY_TYPES.HOST:
    if (requiredVersion && requiredVersion !== currentVersion) {
      passed = false;
    }
    break;
  default:
    if (requiredVersion && !semver.satisfies(currentVersion, requiredVersion)) {
      passed = false;
    }
    break;
  }

  if (!passed) {
    if (!returnObj) {
      return false;
    }

    versionObj.isVersionCompatible = false;
    versionObj.versionIncompatibilityData = { ...incompatibilityData, required: requiredVersion };

    return versionObj;
  }

  return true;
}

// i18n-uses plugins.error.generic, plugins.error.shellVersion, plugins.error.shellVersionMissing, plugins.error.host, plugins.error.kubeVersion, plugins.error.version, plugins.error.developerPkg, plugins.error.primeOnly

/**
 * Whether an extension should be loaded based on the metadata returned by the backend in the UIPlugins resource instance
 * The output will be used to PREVENT loading of an extension that is already installed but isn't compatible with the system
 *
 * String output will display a message on the extension card to notify users on why the extension was not loaded
 *
 * @returns String | Boolean
 */
export function shouldNotLoadPlugin(UIPluginResource, { rancherVersion, kubeVersion }, loadedPlugins) {
  const isCurrRancherPrime = isRancherPrime();

  const {
    name, version, endpoint, compressedEndpoint
  } = UIPluginResource;

  if (!name || !version || (!endpoint && !compressedEndpoint)) {
    return 'plugins.error.generic';
  }

  const parsedRancherVersion = rancherVersion ? parseRancherVersion(rancherVersion) : '';
  const parsedKubeVersion = kubeVersion ? semver.coerce(kubeVersion)?.version : '';
  // semver.coerce will get rid of any suffix on the version numbering (-rc, -head, etc)
  const parsedShellVersion = semver.coerce(UI_EXTENSIONS_API_VERSION)?.version;

  // Shell the extension was built against, propagated from the annotations in
  // pkg/package.json into "spec.plugin.metadata" on the UIPlugin resource. Mandatory, so an
  // extension that declares nothing at all is not loaded.
  const shellVersionRange = requiredShellVersion(UIPluginResource.metadata);

  if (!shellVersionRange) {
    return 'plugins.error.shellVersionMissing';
  } else if (!semver.satisfies(parsedShellVersion, shellVersionRange)) {
    return 'plugins.error.shellVersion';
  }

  // Prime only
  const primeOnlyAnnotation = UIPluginResource.metadata?.[UI_PLUGIN_CHART_ANNOTATIONS.PRIME_ONLY] === 'true';

  if (!isCurrRancherPrime && primeOnlyAnnotation) {
    return 'plugins.error.primeOnly';
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
  const isCurrRancherPrime = isRancherPrime();

  const { version, rancherVersion, kubeVersion } = versionData;
  const versionObj = {
    ...version, isVersionCompatible: true, versionIncompatibilityData: {}
  };

  const parsedRancherVersion = rancherVersion ? parseRancherVersion(rancherVersion) : '';
  const parsedShellVersion = semver.coerce(UI_EXTENSIONS_API_VERSION)?.version;
  const shellVersionRange = requiredShellVersion(version.annotations);

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
      currentVersion:      parsedShellVersion,
      requiredVersion:     shellVersionRange,
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.SHELL_MISSING,
    },
    {
      currentVersion:      parsedShellVersion,
      requiredVersion:     shellVersionRange,
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.SHELL,
    },
    {
      currentVersion:      UI_PLUGIN_HOST_APP,
      requiredVersion:     version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST],
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.HOST,
    },
    {
      currentVersion:      isCurrRancherPrime,
      requiredVersion:     version.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.PRIME_ONLY] === 'true',
      incompatibilityData: EXTENSIONS_INCOMPATIBILITY_DATA.PRIME_ONLY,
    }
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
