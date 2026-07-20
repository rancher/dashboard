import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { MANAGEMENT } from '@shell/config/types';
import { useClusterLocalStorage } from '@shell/composables/useClusterLocalStorage';

const navKey = (clusterId: string) => `${ clusterId }:nav-group-state`;

const mockGetters: Record<string, any> = {};
const mockDispatch = jest.fn();

jest.mock('vuex', () => ({
  useStore: () => ({
    getters: new Proxy(mockGetters, {
      get(target, prop: string) {
        return target[prop];
      },
    }),
    dispatch: (...args: any[]) => mockDispatch(...args),
  }),
}));

describe('composable: useClusterLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockDispatch.mockReset();
    Object.keys(mockGetters).forEach((k) => delete mockGetters[k]);
    // Default: no clusters loaded and pagination off, which disables pruning
    mockGetters['management/all'] = () => [];
    mockGetters['management/paginationEnabled'] = () => false;
    mockGetters.clusterId = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  describe('storageKey', () => {
    it('should scope the key with the provided cluster id', () => {
      const { storageKey } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      expect(storageKey.value).toStrictEqual('c-abc:nav-group-state');
    });

    it('should default to the active cluster id from the store when none is provided', () => {
      mockGetters.clusterId = 'c-store';
      const { storageKey } = useClusterLocalStorage('nav-group-state');

      expect(storageKey.value).toStrictEqual('c-store:nav-group-state');
    });

    it('should be null when there is no cluster id', () => {
      const { storageKey } = useClusterLocalStorage('nav-group-state', () => '');

      expect(storageKey.value).toBeNull();
    });

    it('should update reactively when the cluster id changes', () => {
      const clusterId = ref('c-one');
      const { storageKey } = useClusterLocalStorage('nav-group-state', clusterId);

      expect(storageKey.value).toStrictEqual('c-one:nav-group-state');

      clusterId.value = 'c-two';
      expect(storageKey.value).toStrictEqual('c-two:nav-group-state');

      clusterId.value = '';
      expect(storageKey.value).toBeNull();
    });
  });

  describe('save and load', () => {
    it('should round-trip a JSON value under the cluster key', () => {
      const { save, load } = useClusterLocalStorage<Record<string, boolean>>('nav-group-state', () => 'c-abc');
      const value = { workloads: true, storage: false };

      save(value);

      expect(localStorage.getItem(navKey('c-abc'))).toStrictEqual(JSON.stringify(value));
      expect(load()).toStrictEqual(value);
    });

    it('should isolate values per cluster', () => {
      const clusterId = ref('c-one');
      const { save, load } = useClusterLocalStorage<Record<string, boolean>>('nav-group-state', clusterId);

      save({ a: true });

      clusterId.value = 'c-two';
      expect(load()).toBeNull();

      save({ b: true });
      expect(load()).toStrictEqual({ b: true });

      clusterId.value = 'c-one';
      expect(load()).toStrictEqual({ a: true });
    });

    it('should return null when nothing is stored', () => {
      const { load } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      expect(load()).toBeNull();
    });

    it('should not write when there is no cluster id', () => {
      const { save } = useClusterLocalStorage('nav-group-state', () => '');

      save({ a: true });

      expect(localStorage.length).toStrictEqual(0);
    });

    it('should return null and not throw when there is no cluster id', () => {
      const { load } = useClusterLocalStorage('nav-group-state', () => '');

      expect(load()).toBeNull();
    });
  });

  describe('pruning stale clusters (local, pagination off)', () => {
    it('should remove entries for clusters that no longer exist on save', () => {
      localStorage.setItem(navKey('c-gone'), JSON.stringify({ a: true }));
      mockGetters['management/all'] = () => [{ id: 'c-abc' }];

      const { save } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      save({ b: true });

      expect(localStorage.getItem(navKey('c-gone'))).toBeNull();
      expect(localStorage.getItem(navKey('c-abc'))).toStrictEqual(JSON.stringify({ b: true }));
    });

    it('should keep entries for clusters that still exist', () => {
      localStorage.setItem(navKey('c-other'), JSON.stringify({ a: true }));
      mockGetters['management/all'] = () => [{ id: 'c-abc' }, { id: 'c-other' }];

      const { save } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      save({ b: true });

      expect(localStorage.getItem(navKey('c-other'))).toStrictEqual(JSON.stringify({ a: true }));
    });

    it('should not prune when no clusters are loaded (avoids wiping everything)', () => {
      localStorage.setItem(navKey('c-gone'), JSON.stringify({ a: true }));
      mockGetters['management/all'] = () => [];

      const { save } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      save({ b: true });

      expect(localStorage.getItem(navKey('c-gone'))).toStrictEqual(JSON.stringify({ a: true }));
    });

    it('should only prune entries that match the key suffix', () => {
      localStorage.setItem('c-gone:other-feature', JSON.stringify({ a: true }));
      mockGetters['management/all'] = () => [{ id: 'c-abc' }];

      const { save } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      save({ b: true });

      expect(localStorage.getItem('c-gone:other-feature')).toStrictEqual(JSON.stringify({ a: true }));
    });

    it('should not query the API when pagination is off', () => {
      mockGetters['management/all'] = () => [{ id: 'c-abc' }];

      const { save } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      save({ b: true });

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('pruning stale clusters (paginated)', () => {
    beforeEach(() => {
      // Under pagination the store only holds loaded pages, so existence is
      // checked via a server-side filtered findPage instead of management/all
      mockGetters['management/paginationEnabled'] = () => true;
    });

    it('should remove entries the API does not return', async() => {
      localStorage.setItem(navKey('c-abc'), JSON.stringify({ a: true }));
      localStorage.setItem(navKey('c-gone'), JSON.stringify({ a: true }));
      // API confirms only c-abc still exists
      mockDispatch.mockResolvedValue({ data: [{ id: 'c-abc' }] });

      const { save } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      save({ b: true });
      await flushPromises();

      expect(mockDispatch).toHaveBeenCalledWith('management/findPage', expect.objectContaining({ type: MANAGEMENT.CLUSTER }));
      expect(localStorage.getItem(navKey('c-gone'))).toBeNull();
      expect(localStorage.getItem(navKey('c-abc'))).toStrictEqual(JSON.stringify({ b: true }));
    });

    it('should keep entries the API confirms still exist', async() => {
      localStorage.setItem(navKey('c-other'), JSON.stringify({ a: true }));
      mockDispatch.mockResolvedValue({ data: [{ id: 'c-abc' }, { id: 'c-other' }] });

      const { save } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      save({ b: true });
      await flushPromises();

      expect(localStorage.getItem(navKey('c-other'))).toStrictEqual(JSON.stringify({ a: true }));
    });

    it('should not query the API when there are no stored entries to check', async() => {
      const { save } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      // Stub setItem so saving the current value doesn't create an entry to check
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

      save({ b: true });
      await flushPromises();

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('should return null and warn when the stored value is not valid JSON', () => {
      localStorage.setItem(navKey('c-abc'), '{not valid json');
      const { load } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      expect(load()).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should not throw but warn when setItem throws (e.g. quota exceeded)', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const { save } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      expect(() => save({ a: true })).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should return null and warn when getItem throws', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      const { load } = useClusterLocalStorage('nav-group-state', () => 'c-abc');

      expect(load()).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});
