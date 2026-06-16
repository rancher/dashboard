import type { Plugin, Version } from '@shell/types/uiplugins';
import { getPluginChartVersion, getPluginChartVersionLabel } from '../uiplugins';

function makePlugin(partial: Partial<Plugin>): Plugin {
  return {
    name:                   'test',
    label:                  'Test',
    description:            '',
    id:                     'test',
    versions:               [],
    installed:              false,
    builtin:                false,
    experimental:           false,
    certified:              false,
    chart:                  {} as any,
    incompatibilityMessage: '',
    installableVersions:    [],
    displayVersion:         '',
    pluginVersionLabel:     '',
    helmError:              false,
    ...partial
  };
}

describe('fx: getPluginChartVersion', () => {
  it('returns the Helm Chart version when displayVersion matches appVersion', () => {
    const plugin = makePlugin({
      displayVersion: '1.2.3',
      versions:       [
        { appVersion: '1.2.3', version: '4.5.6' } as Version,
        { appVersion: '2.0.0', version: '5.0.0' } as Version
      ]
    });

    expect(getPluginChartVersion(plugin)).toBe('4.5.6');
  });

  it('falls back to version if appVersion is not present', () => {
    const plugin = makePlugin({
      displayVersion: '7.8.9',
      versions:       [
        { version: '7.8.9' } as Version,
        { version: '8.0.0' } as Version
      ]
    });

    expect(getPluginChartVersion(plugin)).toBe('7.8.9');
  });

  it('returns displayVersion if no matching chart is found', () => {
    const plugin = makePlugin({
      displayVersion: '9.9.9',
      versions:       [
        { appVersion: '1.0.0', version: '1.0.0' } as Version,
        { appVersion: '2.0.0', version: '2.0.0' } as Version
      ]
    });

    expect(getPluginChartVersion(plugin)).toBe('9.9.9');
  });

  it('returns undefined if plugin is undefined', () => {
    expect(getPluginChartVersion(undefined)).toBeUndefined();
  });

  it('returns displayVersion if plugin.versions is undefined', () => {
    const plugin = makePlugin({ displayVersion: '1.0.0', versions: undefined as any });

    expect(getPluginChartVersion(plugin)).toBe('1.0.0');
  });
});

describe('fx: getPluginChartVersionLabel', () => {
  it('returns simple version string if Helm Chart Version appVersion matches version', () => {
    const version = { version: '1.2.3', appVersion: '1.2.3' } as Version;

    expect(getPluginChartVersionLabel(version)).toBe('1.2.3');
  });
  it(`if version and appVersion don't match, it returns 'appVersion (version)' string`, () => {
    const version = { version: '1.2.3', appVersion: '4.5.6' } as Version;

    expect(getPluginChartVersionLabel(version)).toBe('4.5.6 (1.2.3)');
  });
});
