import type { Plugin, Version } from '@shell/types/uiplugins';
import { getPluginChartVersion, getPluginChartVersionLabel, getLatestPluginVersions, isNewerVersion } from '../uiplugins';

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

describe('fx: isNewerVersion', () => {
  it.each([
    ['2.0.0', '1.0.0', true],
    ['1.1.0', '1.0.9', true],
    ['1.0.0', '2.0.0', false],
    ['1.0.0', '1.0.0', false],
    ['1.0.0-rc1', '0.9.0', true],
  ])('compares %s against %s as %s', (version, otherVersion, expected) => {
    expect(isNewerVersion(version, otherVersion)).toBe(expected);
  });

  it.each([
    [undefined, '1.0.0'],
    ['1.0.0', undefined],
    [undefined, undefined],
    ['', '1.0.0'],
  ])('is false when either side is missing (%s, %s)', (version, otherVersion) => {
    expect(isNewerVersion(version, otherVersion)).toBe(false);
  });

  it('falls back to inequality rather than throwing on versions which are not semver', () => {
    expect(isNewerVersion('nightly', '1.0.0')).toBe(true);
    expect(isNewerVersion('1.0.0', 'nightly')).toBe(true);
    expect(isNewerVersion('nightly', 'nightly')).toBe(false);
  });
});

describe('fx: getLatestPluginVersions', () => {
  const makeVersions = (versions: string[]) => versions.map((version) => ({ version } as Version));
  const versionStrings = (versions: Version[]) => versions.map((v) => v.version);

  it('keeps the latest version of each newer minor, the current version and the two minors before it', () => {
    const versions = makeVersions([
      '4.1.3', '4.1.2', '4.1.1', '4.1.0', '3.0.11', '3.0.8', '3.0.1', '3.0.0', '2.2.0', '2.1.12', '2.1.8', '2.0.0'
    ]);

    expect(versionStrings(getLatestPluginVersions(versions, '4.1.0'))).toStrictEqual(['4.1.3', '4.1.0', '3.0.11', '2.2.0']);
  });

  it('keeps every minor newer than the current version, however many there are', () => {
    const versions = makeVersions(['5.0.1', '5.0.0', '4.2.0', '4.1.1', '4.1.0', '3.0.0', '2.0.0', '1.0.0']);

    expect(versionStrings(getLatestPluginVersions(versions, '4.1.0'))).toStrictEqual(['5.0.1', '4.2.0', '4.1.1', '4.1.0', '3.0.0', '2.0.0']);
  });

  it('keeps the current version when it is not the latest of its minor', () => {
    const versions = makeVersions(['1.2.3', '1.2.2', '1.2.1', '1.1.0']);

    expect(versionStrings(getLatestPluginVersions(versions, '1.2.1'))).toStrictEqual(['1.2.3', '1.2.1', '1.1.0']);
  });

  it('collapses patch releases of the same minor', () => {
    const versions = makeVersions(['0.8.4', '0.8.3', '0.8.3-rc2', '0.8.2', '0.8.1']);

    expect(versionStrings(getLatestPluginVersions(versions, '0.8.3-rc2'))).toStrictEqual(['0.8.4', '0.8.3-rc2']);
  });

  it('anchors on the newest version when there is no current version', () => {
    const versions = makeVersions(['4.1.3', '4.1.0', '3.0.11', '2.2.0', '2.1.12', '2.0.0']);

    expect(versionStrings(getLatestPluginVersions(versions))).toStrictEqual(['4.1.3', '3.0.11', '2.2.0']);
  });

  it('anchors on the newest version when the current version is not in the list', () => {
    const versions = makeVersions(['4.1.3', '3.0.11', '2.2.0', '2.1.12', '2.0.0']);

    expect(versionStrings(getLatestPluginVersions(versions, '9.9.9'))).toStrictEqual(['4.1.3', '3.0.11', '2.2.0']);
  });

  it('keeps pinned versions which would otherwise be trimmed', () => {
    const versions = makeVersions(['4.1.3', '4.1.2', '3.0.0', '2.0.0', '1.0.0']);

    expect(versionStrings(getLatestPluginVersions(versions, '4.1.3', ['1.0.0']))).toStrictEqual(['4.1.3', '3.0.0', '2.0.0', '1.0.0']);
  });

  it('keeps everything when there is nothing to trim', () => {
    const versions = makeVersions(['3.0.0', '2.0.0', '1.0.0']);

    expect(versionStrings(getLatestPluginVersions(versions, '3.0.0'))).toStrictEqual(['3.0.0', '2.0.0', '1.0.0']);
  });

  it('treats versions which are not valid semver as their own release', () => {
    const versions = makeVersions(['nightly', '1.1.1', '1.1.0', '1.0.0', '0.9.0']);

    expect(versionStrings(getLatestPluginVersions(versions, '1.1.1'))).toStrictEqual(['nightly', '1.1.1', '1.0.0', '0.9.0']);
  });

  it('returns an empty list when there are no versions', () => {
    expect(getLatestPluginVersions([], '1.0.0')).toStrictEqual([]);
    expect(getLatestPluginVersions(undefined, '1.0.0')).toStrictEqual([]);
  });
});
