import { nextTick, ref } from 'vue';
import { useResourceShortNames } from '@shell/composables/useResourceShortNames';

const request = jest.fn();

// Schemas as steve reports them: the id the nav uses, plus the group and plural
// resource name that discovery reports the same type against.
const schemas = [
  { id: 'pod', attributes: { group: '', resource: 'pods' } },
  { id: 'configmap', attributes: { group: '', resource: 'configmaps' } },
  { id: 'apps.deployment', attributes: { group: 'apps', resource: 'deployments' } },
  { id: 'helm.cattle.io.helmchart', attributes: { group: 'helm.cattle.io', resource: 'helmcharts' } },
  // No `resource`, so nothing in discovery can be matched to it.
  { id: 'schema', attributes: {} },
];

const mockStore = {
  getters: {
    clusterId:     'c-one',
    'cluster/all': (type: string) => (type === 'schema' ? schemas : []),
  },
  dispatch: (action: string, opt: any) => {
    if (action !== 'cluster/request') {
      throw new Error(`unexpected action ${ action }`);
    }

    return request(opt.url);
  },
};

jest.mock('vuex', () => ({ useStore: () => mockStore }));

const GROUPS = {
  groups: [
    { preferredVersion: { groupVersion: 'apps/v1' } },
    { preferredVersion: { groupVersion: 'helm.cattle.io/v1' } },
    // No schema in the store for this group, so it must never be requested.
    { preferredVersion: { groupVersion: 'secret.stuff/v1' } },
  ],
};

const CORE = {
  resources: [
    { name: 'pods', shortNames: ['po'] },
    { name: 'configmaps', shortNames: ['cm'] },
    { name: 'services' }, // no short names
    { name: 'pods/log', shortNames: ['whatever'] }, // subresource
  ]
};

const APPS = { resources: [{ name: 'deployments', shortNames: ['deploy'] }] };
const HELM = { resources: [{ name: 'helmcharts', shortNames: ['HC'] }] };

/** Resolve the fetch chain, which is several promises deep. */
const settle = async() => {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
  }
};

const respondNormally = () => request.mockImplementation((url: string) => {
  if (url.endsWith('/apis')) {
    return Promise.resolve(GROUPS);
  }
  if (url.endsWith('/api/v1')) {
    return Promise.resolve(CORE);
  }
  if (url.endsWith('/apis/apps/v1')) {
    return Promise.resolve(APPS);
  }
  if (url.endsWith('/apis/helm.cattle.io/v1')) {
    return Promise.resolve(HELM);
  }

  return Promise.reject(new Error(`unexpected url ${ url }`));
});

describe('useResourceShortNames', () => {
  // A fetched cluster is cached for the life of the tab, which is the point, so
  // each test gets a cluster of its own. The id lives in its own ref too: the
  // composable's watcher outlives a test here (in the app it is owned by the
  // component that called it), and a shared ref would let a previous test's
  // watcher start this test's fetch before its mock is in place.
  let clusterCount = 0;
  const newClusterId = () => ref(`c-${ ++clusterCount }`);

  beforeEach(() => {
    jest.clearAllMocks();
    respondNormally();
  });

  it('keys short names by schema id, and covers CRD-backed types too', async() => {
    const shortNames = useResourceShortNames(newClusterId());

    await settle();

    // Discovery reports these against a plural resource name, and the last of
    // them is CRD-backed rather than built into Kubernetes.
    expect(shortNames.value).toStrictEqual({
      pod:                        ['po'],
      configmap:                  ['cm'],
      'apps.deployment':          ['deploy'],
      'helm.cattle.io.helmchart': ['hc'],
    });
  });

  it('starts empty so the caller is never blocked on discovery', () => {
    const shortNames = useResourceShortNames(newClusterId());

    expect(shortNames.value).toStrictEqual({});
  });

  it('lower-cases short names so they match a lower-cased query', async() => {
    const shortNames = useResourceShortNames(newClusterId());

    await settle();

    // The HELM fixture reports `HC`.
    expect(shortNames.value['helm.cattle.io.helmchart']).toStrictEqual(['hc']);
  });

  it('skips groups the store has no schema for, rather than being refused', async() => {
    useResourceShortNames(newClusterId());

    await settle();

    const urls = request.mock.calls.map(([url]) => url);

    expect(urls.some((url: string) => url.includes('secret.stuff'))).toBe(false);
  });

  it('keeps the other groups when one of them fails', async() => {
    request.mockImplementation((url: string) => {
      if (url.endsWith('/apis')) {
        return Promise.resolve(GROUPS);
      }
      if (url.endsWith('/api/v1')) {
        return Promise.resolve(CORE);
      }

      // Every group read is refused.
      return Promise.reject(new Error('403'));
    });

    const shortNames = useResourceShortNames(newClusterId());

    await settle();

    expect(shortNames.value).toStrictEqual({ pod: ['po'], configmap: ['cm'] });
  });

  it('yields an empty map when discovery cannot be read at all', async() => {
    request.mockImplementation(() => Promise.reject(new Error('nope')));

    const shortNames = useResourceShortNames(newClusterId());

    await settle();

    expect(shortNames.value).toStrictEqual({});
  });

  it('fetches a cluster once and reuses the result', async() => {
    const clusterId = newClusterId();
    const first = useResourceShortNames(clusterId);

    await settle();
    const callCount = request.mock.calls.length;

    const second = useResourceShortNames(clusterId);

    await settle();

    expect(request.mock.calls).toHaveLength(callCount);
    expect(second.value).toStrictEqual(first.value);
  });

  it('empties the map when there is no cluster', async() => {
    const clusterId = newClusterId();
    const shortNames = useResourceShortNames(clusterId);

    await settle();
    expect(shortNames.value.pod).toStrictEqual(['po']);

    clusterId.value = '';
    await settle();

    expect(shortNames.value).toStrictEqual({});
  });
});
