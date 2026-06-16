import { abbreviateClusterName, _addonConfigPreserveFilter, addonConfigPreserve } from '@shell/utils/cluster';
import { diff } from '@shell/utils/object';

describe('fx: abbreviateClusterName', () => {
  it.each([
    ['local', 'lcl'],
    ['world-wide-web', 'wwb'],
    ['a', 'a'],
    ['ab', 'ab'],
    ['abc', 'abc'],
    ['', ''],
    ['1', '1'],
    ['12', '12'],
    ['123', '123'],
    ['a1', 'a1'],
    ['aa1', 'aa1'],
    ['aaa1', 'aa1'],
    ['a-b', 'a-b'],
    ['1-2', '1-2'],
    ['a-b-c', 'abc'],
    ['abc-def-ghi', 'adi'],
    ['abcd-efgh', 'adh'],
    ['a-bc', 'abc'],
    ['ab-c', 'abc'],
    ['ab-cd', 'abd'],
    ['a-bcd', 'abd'],
    ['abc-d', 'acd'],
    ['0123-4567-89ab-cdef', '04f'],
    ['0123-4567-89ab-cdef-ghij', '04j'],
    ['0123-4567-8901-2345', '045'],
    ['0123-4567-8901-2345-6789', '049'],
    ['a1b', 'a1b'],
    ['a1b2', 'a12'],
    ['ab12cd34', 'a14'],
    ['test-cluster-one', 'tce'],
    ['test-cluster-1', 'tc1'],
    ['customer-support-team-1', 'cs1'],
    ['customer-support-team-one', 'cse'],
    ['customer-support-team-prod', 'csd'],
    ['customer-support-team-dev', 'csv'],
    ['customer-support-team-prod-1', 'cs1'],
    ['customer-support-team-prod-f1xz', 'csz'],
    ['customer-support-team-dev-1', 'cs1'],
    ['customer-support-team-prod-2', 'cs2'],
    ['customer-support-team-dev-2', 'cs2'],
    ['s322', 's32'],
    ['mew-test10', 'mt0'],
    ['mew-test11', 'mt1'],
    ['sowmya2', 'sa2'],
    ['sowmya4', 'sa4'],
    ['sowmya', 'sma'],
    ['sowmyatest4', 'st4'],
  ])('should evaluate %p as %p', (value, expected) => {
    const result = abbreviateClusterName(value);

    expect(result).toStrictEqual(expected);
  });
});

describe('fx: _addonConfigPreserveFilter', () => {
  it('should return an empty object if there are no differences between default values', () => {
    const oldDefaults = { replicaCount: 1 };
    const newDefaults = { replicaCount: 1 };
    const userVals = { replicaCount: 3 };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = {};

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should return an empty object if no user values are provided', () => {
    const oldDefaults = { replicaCount: 1 };
    const newDefaults = { replicaCount: 2 };
    const userVals = {};
    const diffs = diff(oldDefaults, newDefaults);
    const expected = {};

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should filter out diffs for fields not customized by the user', () => {
    const oldDefaults = {
      replicaCount: 1,
      persistence:  false
    };
    const newDefaults = {
      replicaCount: 2,
      persistence:  true
    };
    const userVals = { replicaCount: 3 };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = { replicaCount: 2 };

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should include diffs for fields customized by the user', () => {
    const oldDefaults = { replicaCount: 1 };
    const newDefaults = { replicaCount: 2 };
    const userVals = { replicaCount: 3 };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = { replicaCount: 2 };

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle nested objects: include diff if user customized nested property', () => {
    const oldDefaults = { service: { port: 80 } };
    const newDefaults = { service: { port: 8080 } };
    const userVals = { service: { port: 9000 } };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = { service: { port: 8080 } };

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle nested objects: exclude diff if user did not customize nested property', () => {
    const oldDefaults = { service: { port: 80, type: 'ClusterIP' } };
    const newDefaults = { service: { port: 8080, type: 'ClusterIP' } };
    const userVals = { service: { type: 'NodePort' } };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = {};

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle nested objects: include diff if user customized a removed nested object', () => {
    const oldDefaults = { service: { port: 80 } };
    const newDefaults = {};
    const userVals = { service: { port: 9000 } };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = { service: { port: null } };

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle nested objects: exclude diff if a new property is added to default nested object and user did not customize it', () => {
    const oldDefaults = { service: { port: 80 } };
    const newDefaults = { service: { port: 80, type: 'ClusterIP' } };
    const userVals = { service: { port: 80 } };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = {};

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle arrays of primitives: include diff if user customized array and default array changed', () => {
    const oldDefaults = { ingress: { hosts: ['host1.com', 'host2.com'] } };
    const newDefaults = { ingress: { hosts: ['host1.com', 'host3.com'] } };
    const userVals = { ingress: { hosts: ['user.host.com'] } };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = { ingress: { hosts: ['host1.com', 'host3.com'] } };

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle arrays of primitives: exclude diff if user did not customize array', () => {
    const oldDefaults = { ingress: { hosts: ['host1.com', 'host2.com'] } };
    const newDefaults = { ingress: { hosts: ['host1.com', 'host3.com'] } };
    const userVals = { ingress: { enabled: true } };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = {};

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle arrays of objects: include diff if user customized array and default array changed', () => {
    const oldDefaults = { service: { ports: [{ name: 'http', port: 80 }] } };
    const newDefaults = { service: { ports: [{ name: 'http', port: 80 }, { name: 'https', port: 443 }] } };
    const userVals = { service: { ports: [{ name: 'http', port: 8080 }] } };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = { service: { ports: [{ name: 'http', port: 80 }, { name: 'https', port: 443 }] } };

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle arrays of objects: exclude diff if user did not customize array', () => {
    const oldDefaults = { service: { ports: [{ name: 'http', port: 80 }] } };
    const newDefaults = { service: { ports: [{ name: 'http', port: 80 }, { name: 'https', port: 443 }] } };
    const userVals = { service: { type: 'ClusterIP' } };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = {};

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle properties added/removed: include diff if user customized a removed property', () => {
    const oldDefaults = { oldProperty: 'defaultValue' };
    const newDefaults = {};
    const userVals = { oldProperty: 'customValue' };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = { oldProperty: null };

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle properties added/removed: exclude diff if user did not customize an added property', () => {
    const oldDefaults = {};
    const newDefaults = { newProperty: 'defaultValue' };
    const userVals = { otherProp: 'value' };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = {};

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });

  it('should handle complex nested structures with multiple changes', () => {
    const oldDefaults = {
      replicaCount: 1,
      image:        {
        repository: 'nginx',
        tag:        'stable'
      },
      service: {
        type: 'ClusterIP',
        port: 80
      },
      ingress: {
        enabled: false,
        hosts:   ['chart-example.local']
      }
    };
    const newDefaults = {
      replicaCount: 2,
      image:        {
        repository: 'nginx',
        tag:        'mainline'
      },
      service: {
        type: 'ClusterIP',
        port: 80
      },
      ingress: {
        enabled: true,
        hosts:   ['chart-example.local', 'new.chart-example.local'],
        tls:     true
      }
    };
    const userVals = {
      replicaCount: 3,
      ingress:      { hosts: ['my.custom.host'] }
    };
    const diffs = diff(oldDefaults, newDefaults);
    const expected = {
      replicaCount: 2,
      ingress:      { hosts: ['chart-example.local', 'new.chart-example.local'] }
    };

    expect(_addonConfigPreserveFilter(diffs, userVals)).toStrictEqual(expected);
  });
});

describe('fx: addonConfigPreserve', () => {
  const ADDON_NAME = 'rke2-my-addon';
  const mockOldVersionCharts = {
    [ADDON_NAME]: {
      repo:    'repo',
      version: '1.0.0'
    }
  };

  const mockNewVersionCharts = {
    [ADDON_NAME]: {
      repo:    'repo',
      version: '1.1.0'
    }
  };

  const mockOldVersionInfo = {
    values: {
      replicas: 1,
      service:  { type: 'ClusterIP' }
    }
  };

  const mockNewVersionInfo = {
    values: {
      replicas:    2, // changed
      service:     { type: 'ClusterIP' },
      persistence: true // new
    }
  };

  let mockStore: any;
  let addonConfigDiffs: any;
  let userChartValues: any;
  let context: any;

  beforeEach(() => {
    mockStore = {
      dispatch: jest.fn((action, payload) => {
        if (action === 'catalog/getVersionInfo') {
          if (payload.versionName === '1.0.0') {
            return Promise.resolve(mockOldVersionInfo);
          }
          if (payload.versionName === '1.1.0') {
            return Promise.resolve(mockNewVersionInfo);
          }
        }

        return Promise.resolve({});
      })
    };
    addonConfigDiffs = {};
    userChartValues = {};
    context = {
      addonConfigDiffs,
      addonNames: [ADDON_NAME],
      $store:     mockStore,
      userChartValues,
    };
  });

  it('should identify no relevant changes if user has no custom values', async() => {
    // No user overrides means no relevant differences.
    context.userChartValues = {};
    await addonConfigPreserve(context, mockOldVersionCharts, mockNewVersionCharts);

    expect(context.addonConfigDiffs[ADDON_NAME]).toStrictEqual({});
    expect(context.userChartValues[`${ ADDON_NAME }-1.1.0`]).toBeUndefined();
  });

  it('should identify no relevant changes if user custom values are for different fields', async() => {
    // User overrides for non-differing fields should not be considered relevant.
    context.userChartValues = { [`${ ADDON_NAME }-1.0.0`]: { service: { type: 'NodePort' } } };
    await addonConfigPreserve(context, mockOldVersionCharts, mockNewVersionCharts);

    expect(context.addonConfigDiffs[ADDON_NAME]).toStrictEqual({});
    // Since diffs are empty, user values should be preserved
    expect(context.userChartValues[`${ ADDON_NAME }-1.1.0`]).toStrictEqual({ service: { type: 'NodePort' } });
  });

  it('should identify relevant changes if user has customized a changed field', async() => {
    // A user override on a changed default should be flagged as a relevant difference.
    context.userChartValues = { [`${ ADDON_NAME }-1.0.0`]: { replicas: 3 } };
    await addonConfigPreserve(context, mockOldVersionCharts, mockNewVersionCharts);

    expect(context.addonConfigDiffs[ADDON_NAME]).toStrictEqual({ replicas: 2 });
    // Since diffs are NOT empty, user values should NOT be preserved
    expect(context.userChartValues[`${ ADDON_NAME }-1.1.0`]).toBeUndefined();
  });

  it('should not identify relevant changes for new fields not customized by user', async() => {
    // New fields in the addon default values are not relevant if not customized by the user.
    context.userChartValues = { [`${ ADDON_NAME }-1.0.0`]: {} };
    await addonConfigPreserve(context, mockOldVersionCharts, mockNewVersionCharts);

    // The only diff is `replicas`, which user didn't touch. `persistence` is new but also not touched.
    // So final diffs should be empty.
    expect(context.addonConfigDiffs[ADDON_NAME]).toStrictEqual({});
    expect(context.userChartValues[`${ ADDON_NAME }-1.1.0`]).toStrictEqual({});
  });

  it('should preserve user values if there are no relevant differences', async() => {
    // User values should be carried over to the new version if no relevant diffs are found.
    context.userChartValues = { [`${ ADDON_NAME }-1.0.0`]: { service: { type: 'NodePort' } } };
    await addonConfigPreserve(context, mockOldVersionCharts, mockNewVersionCharts);

    expect(context.addonConfigDiffs[ADDON_NAME]).toStrictEqual({});
    expect(context.userChartValues[`${ ADDON_NAME }-1.1.0`]).toStrictEqual({ service: { type: 'NodePort' } });
  });

  it('should not preserve user values if there are relevant differences', async() => {
    // User values should not be carried over if relevant diffs are found.
    context.userChartValues = { [`${ ADDON_NAME }-1.0.0`]: { replicas: 3 } };
    await addonConfigPreserve(context, mockOldVersionCharts, mockNewVersionCharts);

    expect(context.addonConfigDiffs[ADDON_NAME]).toStrictEqual({ replicas: 2 });
    expect(context.userChartValues[`${ ADDON_NAME }-1.1.0`]).toBeUndefined();
  });

  it('should handle catalog API errors gracefully', async() => {
    // Errors from fetching chart info should be caught and handled.
    const error = new Error('catalog fetch failed');

    jest.spyOn(context.$store, 'dispatch').mockImplementation().mockRejectedValue(error);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    await addonConfigPreserve(context, mockOldVersionCharts, mockNewVersionCharts);

    expect(context.addonConfigDiffs[ADDON_NAME]).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(`Failed to get chart version info for diff for chart ${ ADDON_NAME }`, error);
    errorSpy.mockRestore();
  });

  it('should do nothing if oldCharts is not provided', async() => {
    await addonConfigPreserve(context, {}, mockNewVersionCharts);
    expect(context.addonConfigDiffs).toStrictEqual({});
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });

  it('should do nothing if newCharts is not provided', async() => {
    await addonConfigPreserve(context, mockOldVersionCharts, {});
    expect(context.addonConfigDiffs).toStrictEqual({});
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });

  it('should do nothing if addon version is the same', async() => {
    const mockNewVersionSame = {
      [ADDON_NAME]: {
        repo:    'repo',
        version: '1.0.0'
      }
    };

    await addonConfigPreserve(context, mockOldVersionCharts, mockNewVersionSame);
    expect(context.addonConfigDiffs[ADDON_NAME]).toBeUndefined();
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });

  it('should handle multiple addons', async() => {
    const ADDON2_NAME = 'rke2-my-addon2';
    const ADDON3_NAME = 'rke2-my-addon3'; // same version

    const oldCharts = {
      ...mockOldVersionCharts,
      [ADDON2_NAME]: { repo: 'repo', version: '1.0.0' },
      [ADDON3_NAME]: { repo: 'repo', version: '1.0.0' },
    };
    const newCharts = {
      ...mockNewVersionCharts,
      [ADDON2_NAME]: { repo: 'repo', version: '1.1.0' }, // changed version, but no user values
      [ADDON3_NAME]: { repo: 'repo', version: '1.0.0' }, // same version
    };

    context.addonNames = [ADDON_NAME, ADDON2_NAME, ADDON3_NAME];
    context.userChartValues = { [`${ ADDON_NAME }-1.0.0`]: { replicas: 3 } };

    await addonConfigPreserve(context, oldCharts, newCharts);

    expect(context.addonConfigDiffs[ADDON_NAME]).toStrictEqual({ replicas: 2 });
    expect(context.addonConfigDiffs[ADDON2_NAME]).toStrictEqual({});
    expect(context.addonConfigDiffs[ADDON3_NAME]).toBeUndefined();
  });
});
