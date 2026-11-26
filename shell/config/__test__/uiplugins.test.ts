import {
  UI_PLUGIN_ANNOTATION,
  UI_PLUGIN_CHART_ANNOTATIONS,
  EXTENSIONS_INCOMPATIBILITY_TYPES,
  INFERRED_SHELL_VERSION_RANGE,
  isUIPlugin,
  uiPluginHasAnnotation,
  parseRancherVersion,
  requiredShellVersion,
  // shouldNotLoadPlugin, this is required per test so that we can reload the module with a
  // different UI_EXTENSIONS_API_VERSION in the environment
  isSupportedChartVersion,
  isChartVersionHigher
} from '@shell/config/uiplugins';

import * as VersionModule from '@shell/config/version';

// The Shell these tests run as. 217 is the first release line of the new scheme, so the range
// inferred for an extension published before the scheme existed applies to it.
const MOCK_API_VERSION = '217.0.0-alpha.0';
const IN_RANGE_SHELL = '>= 217.0.0 < 220.0.0';
const OUT_OF_RANGE_SHELL = '>= 220.0.0 < 223.0.0';

describe('uiPlugins Config methods', () => {
  describe('fx: isUIPlugin', () => {
    const pluginChart = { versions: [{ annotations: { [UI_PLUGIN_ANNOTATION.NAME]: UI_PLUGIN_ANNOTATION.VALUE } }, { annotations: {} }] };

    it('should return true if any version has the UI plugin annotation', () => {
      expect(isUIPlugin(pluginChart)).toBe(true);
    });
    it('should return false if chart is null/undefined', () => {
      expect(isUIPlugin(null)).toBe(false);
    });
  });

  describe('fx: uiPluginHasAnnotation', () => {
    const version1 = { annotations: { [UI_PLUGIN_ANNOTATION.NAME]: UI_PLUGIN_ANNOTATION.VALUE } };
    const chart = { versions: [version1] };

    it('should return true if it finds version with annotation and its corresponding value', () => {
      expect(uiPluginHasAnnotation(chart, UI_PLUGIN_ANNOTATION.NAME, UI_PLUGIN_ANNOTATION.VALUE)).toBe(true);
    });
    it('should return false if chart has no version with a given pair of annotation/value', () => {
      expect(uiPluginHasAnnotation(chart, 'bananas', UI_PLUGIN_ANNOTATION.VALUE)).toBe(false);
    });
  });

  describe('fx: parseRancherVersion', () => {
    it('should handle standard version strings', () => {
      expect(parseRancherVersion('v2.8.1')).toBe('2.8.1');
    });
    it('should apply .999 patch for RC versions', () => {
      expect(parseRancherVersion('v2.8.1-rc1')).toBe('2.8.999');
    });
    it('should apply .999 patch for "head" versions', () => {
      expect(parseRancherVersion('2.8.0-head')).toBe('2.8.999');
    });
  });

  describe('fx: requiredShellVersion', () => {
    it('uses the declared Shell range when the extension has one', () => {
      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.SHELL_VERSION]: OUT_OF_RANGE_SHELL };

      expect(requiredShellVersion(annotations)).toStrictEqual(OUT_OF_RANGE_SHELL);
    });

    it('prefers the declared Shell range over the retired annotation', () => {
      const annotations = {
        [UI_PLUGIN_CHART_ANNOTATIONS.SHELL_VERSION]:      OUT_OF_RANGE_SHELL,
        [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>= 3.0.0 < 4.0.0'
      };

      expect(requiredShellVersion(annotations)).toStrictEqual(OUT_OF_RANGE_SHELL);
    });

    it('infers a range from the retired annotation, whatever its value', () => {
      expect(requiredShellVersion({ [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>= 3.0.0 < 4.0.0' })).toStrictEqual(INFERRED_SHELL_VERSION_RANGE);
      expect(requiredShellVersion({ [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>= 1.0.0' })).toStrictEqual(INFERRED_SHELL_VERSION_RANGE);
    });

    it('declares nothing when there are no annotations at all', () => {
      expect(requiredShellVersion({})).toBeUndefined();
    });

    it('declares nothing when only unrelated annotations are present', () => {
      expect(requiredShellVersion({ [UI_PLUGIN_CHART_ANNOTATIONS.KUBE_VERSION]: '>= 1.0.0' })).toBeUndefined();
    });

    it('declares nothing when the annotations are undefined', () => {
      expect(requiredShellVersion(undefined)).toBeUndefined();
    });

    it('ignores an empty declared range and falls through', () => {
      const annotations = {
        [UI_PLUGIN_CHART_ANNOTATIONS.SHELL_VERSION]:      '',
        [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>= 3.0.0 < 4.0.0'
      };

      expect(requiredShellVersion(annotations)).toStrictEqual(INFERRED_SHELL_VERSION_RANGE);
    });
  });

  const PLUGIN_NAME = 'test-plugin';

  const basePluginResource = {
    name:     PLUGIN_NAME,
    version:  '1.0.0',
    endpoint: '/some/path',
    metadata: { [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0' }
  };
  const compatibleEnv = {
    rancherVersion: '2.7.5',
    kubeVersion:    'v1.25.10',
  };

  describe('fx: shouldNotLoadPlugin', () => {
    beforeEach(() => {
      jest.resetModules();
      process.env.UI_EXTENSIONS_API_VERSION = MOCK_API_VERSION;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return false when compatible', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      expect(shouldNotLoadPlugin(basePluginResource, compatibleEnv, [])).toBe(false);
    });

    it('should return false when the extension declares a Shell range that matches', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      const compatibleShellPlugin = {
        ...basePluginResource,
        metadata: { [UI_PLUGIN_CHART_ANNOTATIONS.SHELL_VERSION]: IN_RANGE_SHELL }
      };

      expect(shouldNotLoadPlugin(compatibleShellPlugin, compatibleEnv, [])).toBe(false);
    });

    it('should return "plugins.error.shellVersion" if the declared Shell range does not match', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      const incompatibleShellPlugin = {
        ...basePluginResource,
        metadata: { [UI_PLUGIN_CHART_ANNOTATIONS.SHELL_VERSION]: OUT_OF_RANGE_SHELL }
      };

      expect(shouldNotLoadPlugin(incompatibleShellPlugin, compatibleEnv, [])).toBe('plugins.error.shellVersion');
    });

    it('should return "plugins.error.shellVersionMissing" if the extension declares neither annotation', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      const undeclaredPlugin = { ...basePluginResource, metadata: {} };

      expect(shouldNotLoadPlugin(undeclaredPlugin, compatibleEnv, [])).toBe('plugins.error.shellVersionMissing');
    });

    it('should ignore the value of the retired ui-extensions-version annotation', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      // `>=4.0.0` would have blocked this under the old gate. Only its presence matters now,
      // and it stands in for the inferred range, which this Shell is inside.
      const legacyPlugin = {
        ...basePluginResource,
        metadata: { [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=4.0.0' }
      };

      expect(shouldNotLoadPlugin(legacyPlugin, compatibleEnv, [])).toBe(false);
    });

    it('should stop loading inferred extensions once the Shell moves past the inferred range', () => {
      process.env.UI_EXTENSIONS_API_VERSION = '220.0.0';
      jest.resetModules();

      const { shouldNotLoadPlugin } = require('./../uiplugins');

      expect(shouldNotLoadPlugin(basePluginResource, compatibleEnv, [])).toBe('plugins.error.shellVersion');
    });

    it('should return "plugins.error.primeOnly" if extension is Prime-only and Rancher is not Prime', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      jest.spyOn(VersionModule, 'isRancherPrime').mockReturnValue(false);

      const incompatibleApiPlugin = {
        ...basePluginResource,
        metadata: {
          [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0',
          [UI_PLUGIN_CHART_ANNOTATIONS.PRIME_ONLY]:         'true'
        }
      };

      expect(shouldNotLoadPlugin(incompatibleApiPlugin, compatibleEnv, [])).toBe('plugins.error.primeOnly');
    });

    it('should return "plugins.error.host" if HOST application value is incompatible', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      const incompatibleApiPlugin = {
        ...basePluginResource,
        metadata: {
          [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0',
          [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST]:    'rancher-dummy-host'
        }
      };

      expect(shouldNotLoadPlugin(incompatibleApiPlugin, compatibleEnv, [])).toBe('plugins.error.host');
    });

    it('should return false if HOST application value is rancher-manager', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      const hostPlugin = {
        ...basePluginResource,
        metadata: {
          [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0',
          [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST]:    'rancher-manager'
        }
      };

      expect(shouldNotLoadPlugin(hostPlugin, compatibleEnv, [])).toBe(false);
    });

    it('should return "plugins.error.kubeVersion" if incompatible', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      const incompatibleApiPlugin = {
        ...basePluginResource,
        metadata: {
          [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0',
          [UI_PLUGIN_CHART_ANNOTATIONS.KUBE_VERSION]:       '>= 2.0.0'
        }
      };

      expect(shouldNotLoadPlugin(incompatibleApiPlugin, compatibleEnv, [])).toBe('plugins.error.kubeVersion');
    });

    it('should return "plugins.error.version" if incompatible', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      const incompatibleApiPlugin = {
        ...basePluginResource,
        metadata: {
          [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0',
          [UI_PLUGIN_CHART_ANNOTATIONS.RANCHER_VERSION]:    '>= 3.0.0'
        }
      };

      expect(shouldNotLoadPlugin(incompatibleApiPlugin, compatibleEnv, [])).toBe('plugins.error.version');
    });

    it('should return "plugins.error.developerPkg" if a builtin extension with the same name was loaded first', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      const incompatibleApiPlugin = {
        ...basePluginResource,
        metadata: { [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0' }
      };

      expect(shouldNotLoadPlugin(incompatibleApiPlugin, compatibleEnv, [{ name: PLUGIN_NAME, builtin: true }])).toBe('plugins.error.developerPkg');
    });
  });

  describe('fx: isSupportedChartVersion', () => {
    beforeEach(() => {
      jest.resetModules();
      process.env.UI_EXTENSIONS_API_VERSION = MOCK_API_VERSION;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const versionData = {
      rancherVersion: 'v2.7.5',
      kubeVersion:    'v1.25.10',
      version:        '1.0.0'
    };

    it('should return "isVersionCompatible" true when compatible', () => {
      const { isSupportedChartVersion } = require('./../uiplugins');

      const annotations = {
        [UI_PLUGIN_CHART_ANNOTATIONS.KUBE_VERSION]:       '>=1.0.0',
        [UI_PLUGIN_CHART_ANNOTATIONS.RANCHER_VERSION]:    '>=2.0.0',
        [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=2.0.0'
      };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(true);
      expect(result.versionIncompatibilityData).toStrictEqual({});
    });

    it('should return incompatibility object for kube version mismatch', () => {
      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.KUBE_VERSION]: '>=2.0.0' };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(false);
      expect(result.versionIncompatibilityData.type).toBe(EXTENSIONS_INCOMPATIBILITY_TYPES.KUBE);
      expect(result.versionIncompatibilityData.required).toBe('>=2.0.0');
    });

    it('should return incompatibility object for Rancher version mismatch', () => {
      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.RANCHER_VERSION]: '>=3.0.0' };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(false);
      expect(result.versionIncompatibilityData.type).toBe(EXTENSIONS_INCOMPATIBILITY_TYPES.UI);
      expect(result.versionIncompatibilityData.required).toBe('>=3.0.0');
    });

    it('should return incompatibility object for UI version mismatch', () => {
      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.UI_VERSION]: '>=3.0.0' };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(false);
      expect(result.versionIncompatibilityData.type).toBe(EXTENSIONS_INCOMPATIBILITY_TYPES.UI);
      expect(result.versionIncompatibilityData.required).toBe('>=3.0.0');
    });

    it('should return incompatibility object when the chart declares no Shell range', () => {
      const annotations = {};
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(false);
      expect(result.versionIncompatibilityData.type).toBe(EXTENSIONS_INCOMPATIBILITY_TYPES.SHELL_MISSING);
      expect(result.versionIncompatibilityData.required).toBeUndefined();
    });

    it('should return incompatibility object for Shell version mismatch', () => {
      const { isSupportedChartVersion } = require('./../uiplugins');

      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.SHELL_VERSION]: OUT_OF_RANGE_SHELL };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(false);
      expect(result.versionIncompatibilityData.type).toBe(EXTENSIONS_INCOMPATIBILITY_TYPES.SHELL);
      expect(result.versionIncompatibilityData.required).toBe(OUT_OF_RANGE_SHELL);
    });

    it('should stay compatible for a chart carrying only the retired annotation', () => {
      const { isSupportedChartVersion } = require('./../uiplugins');

      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>= 3.0.0 < 4.0.0' };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(true);
      expect(result.versionIncompatibilityData).toStrictEqual({});
    });

    it('should return incompatibility object for HOST_APP mismatch', () => {
      const { isSupportedChartVersion } = require('./../uiplugins');

      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0 < 5.0.0', [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST]: 'rancher-dummy-host' };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(false);
      expect(result.versionIncompatibilityData.type).toBe(EXTENSIONS_INCOMPATIBILITY_TYPES.HOST);
      expect(result.versionIncompatibilityData.required).toBe('rancher-dummy-host');
    });

    it('should return "isVersionCompatible" true when HOST_APP is rancher-manager', () => {
      const { isSupportedChartVersion } = require('./../uiplugins');

      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0 < 5.0.0', [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_HOST]: 'rancher-manager' };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(true);
      expect(result.versionIncompatibilityData).toStrictEqual({});
    });

    it('should return incompatibility object for Prime only extension running in non-prime env', () => {
      const { isSupportedChartVersion } = require('./../uiplugins');

      jest.spyOn(VersionModule, 'isRancherPrime').mockReturnValue(false);

      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=1.0.0 < 5.0.0', [UI_PLUGIN_CHART_ANNOTATIONS.PRIME_ONLY]: 'true' };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(false);
      expect(result.versionIncompatibilityData.type).toBe(EXTENSIONS_INCOMPATIBILITY_TYPES.PRIME_ONLY);
      expect(result.versionIncompatibilityData.required).toBe(true);
    });
  });

  describe('fx: isChartVersionHigher', () => {
    // Tests now rely on the actual semver.gt implementation
    it('should return true when version A is higher', () => {
      expect(isChartVersionHigher('2.1.0', '2.0.0')).toBe(true);
    });
    it('should return false when version A is lower or equal', () => {
      expect(isChartVersionHigher('2.0.0', '2.1.0')).toBe(false);
      expect(isChartVersionHigher('2.0.0', '2.0.0')).toBe(false);
    });
  });
});
