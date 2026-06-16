import {
  UI_PLUGIN_ANNOTATION,
  UI_PLUGIN_CHART_ANNOTATIONS,
  EXTENSIONS_INCOMPATIBILITY_TYPES,
  isUIPlugin,
  uiPluginHasAnnotation,
  parseRancherVersion,
  // shouldNotLoadPlugin, this is required per test so that we can mock semver.coerce
  isSupportedChartVersion,
  isChartVersionHigher
} from '@shell/config/uiplugins';

import * as VersionModule from '@shell/config/version';

let semver;
let originalCoerce: any;
const MOCK_API_VERSION = '33.33.33';

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

      semver = require('semver');
      originalCoerce = semver.coerce;

      jest.spyOn(semver, 'coerce').mockImplementation((v) => {
        if (v === MOCK_API_VERSION) {
          return { version: '3.0.0' };
        }

        // Use the original for all other inputs (Rancher, Kube)
        return originalCoerce(v);
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return false when compatible', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      expect(shouldNotLoadPlugin(basePluginResource, compatibleEnv, [])).toBe(false);
    });

    it('should return "plugins.error.api" if Extensions API version is incompatible', () => {
      const { shouldNotLoadPlugin } = require('./../uiplugins');

      const incompatibleApiPlugin = {
        ...basePluginResource,
        metadata: { [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=4.0.0' }
      };

      expect(shouldNotLoadPlugin(incompatibleApiPlugin, compatibleEnv, [])).toBe('plugins.error.api');
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

      semver = require('semver');
      originalCoerce = semver.coerce;

      jest.spyOn(semver, 'coerce').mockImplementation((v) => {
        if (v === MOCK_API_VERSION) {
          return { version: '3.0.0' };
        }

        // Use the original for all other inputs (Rancher, Kube)
        return originalCoerce(v);
      });
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

    it('should return incompatibility object for extensions api missing', () => {
      const annotations = {};
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(false);
      expect(result.versionIncompatibilityData.type).toBe(EXTENSIONS_INCOMPATIBILITY_TYPES.EXTENSIONS_API_MISSING);
      expect(result.versionIncompatibilityData.required).toBeUndefined();
    });

    it('should return incompatibility object for extensions API version mismatch', () => {
      const { isSupportedChartVersion } = require('./../uiplugins');

      const annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.EXTENSIONS_VERSION]: '>=4.0.0' };
      const data = { ...versionData, version: { annotations } };
      const result = isSupportedChartVersion(data, true);

      expect(result.isVersionCompatible).toBe(false);
      expect(result.versionIncompatibilityData.type).toBe(EXTENSIONS_INCOMPATIBILITY_TYPES.EXTENSIONS_API);
      expect(result.versionIncompatibilityData.required).toBe('>=4.0.0');
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
