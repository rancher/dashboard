import { shallowMount } from '@vue/test-utils';
import Token from '@shell/edit/token.vue';
import { SETTING } from '@shell/config/settings';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { CAPI } from '@shell/config/labels-annotations';
import { VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import { LABEL_SELECT_KINDS } from '@shell/types/components/labeledSelect';

// DetailText -> CopyToClipboard pulls in the ESM-only clipboard-polyfill, which jest can't transform
jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

interface StoreOptions {
  hideLocal?: boolean;
  maxTTL?: string;
}

const makeStore = ({ hideLocal = false, maxTTL = '0' }: StoreOptions = {}) => ({
  getters: {
    'i18n/t':          (k: string) => k,
    currentStore:      () => 'management',
    'features/get':    () => false, // Treat harvester container workloads as disabled
    'management/byId': (_type: string, id: string) => {
      if (id === SETTING.AUTH_TOKEN_MAX_TTL_MINUTES) {
        return { value: maxTTL };
      }
      if (id === SETTING.HIDE_LOCAL_CLUSTER) {
        return { value: `${ hideLocal }` };
      }

      return undefined;
    },
  },
  dispatch: jest.fn(),
});

const mountToken = (value: any = {}, storeOptions?: StoreOptions) => shallowMount(Token, {
  props:  { value: { type: 'management.cattle.io.token', ...value }, mode: 'create' },
  global: {
    mocks: {
      $fetchState: { pending: false },
      $route:      { name: 'account', query: {} },
      $store:      makeStore(storeOptions),
    },
  },
});

describe('view: token.vue', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('noScopeOption', () => {
    it('uses a truthy sentinel value so vue-select can render it as selected', () => {
      const { noScopeOption } = mountToken().vm;

      // vue-select treats '' as "nothing selected", so the sentinel must not be an empty string
      expect(noScopeOption.value).not.toStrictEqual('');
      expect(!!noScopeOption.value).toStrictEqual(true);
      expect(noScopeOption.kind).toStrictEqual(LABEL_SELECT_KINDS.NONE);
      expect(noScopeOption.label).toStrictEqual('accountAndKeys.apiKeys.add.noScope');
    });
  });

  describe('clusterScope', () => {
    it('reports "no scope" when clusterId is unset', () => {
      const wrapper = mountToken();

      expect(wrapper.vm.clusterScope).toStrictEqual(wrapper.vm.noScopeOption.value);
    });

    it('reports "no scope" when clusterId is an empty string', () => {
      const wrapper = mountToken({ clusterId: '' });

      expect(wrapper.vm.clusterScope).toStrictEqual(wrapper.vm.noScopeOption.value);
    });

    it('reports the cluster id when one is selected', () => {
      const wrapper = mountToken({ clusterId: 'c-abc' });

      expect(wrapper.vm.clusterScope).toStrictEqual('c-abc');
    });

    it('stores an empty string when "no scope" is selected', () => {
      const wrapper = mountToken({ clusterId: 'c-abc' });

      wrapper.vm.clusterScope = wrapper.vm.noScopeOption.value;

      expect(wrapper.vm.value.clusterId).toStrictEqual('');
    });

    it('stores the cluster id when a cluster is selected', () => {
      const wrapper = mountToken();

      wrapper.vm.clusterScope = 'c-xyz';

      expect(wrapper.vm.value.clusterId).toStrictEqual('c-xyz');
    });
  });

  describe('scopeAllSettings (pagination off)', () => {
    it('maps and sorts clusters by label, prepending "no scope"', () => {
      const wrapper = mountToken();
      const { updateResources } = wrapper.vm.scopeAllSettings;

      const result = updateResources([
        { id: 'c-b', nameDisplay: 'Beta' },
        { id: 'c-a', nameDisplay: 'Alpha' },
      ]);

      expect(result[0]).toStrictEqual(wrapper.vm.noScopeOption);
      expect(result.slice(1)).toStrictEqual([
        { value: 'c-a', label: 'Alpha' },
        { value: 'c-b', label: 'Beta' },
      ]);
    });

    it('filters out harvester clusters', () => {
      const wrapper = mountToken();
      const { updateResources } = wrapper.vm.scopeAllSettings;

      const result = updateResources([
        { id: 'c-n', nameDisplay: 'Normal' },
        {
          id: 'c-h', nameDisplay: 'Harvester', metadata: { labels: { [CAPI.PROVIDER]: VIRTUAL_HARVESTER_PROVIDER } }
        },
      ]);

      expect(result.map((o: any) => o.value)).not.toContain('c-h');
      expect(result.map((o: any) => o.value)).toContain('c-n');
    });

    it('filters out the local cluster when hide-local is enabled', () => {
      const wrapper = mountToken({}, { hideLocal: true });
      const { updateResources } = wrapper.vm.scopeAllSettings;

      const result = updateResources([
        {
          id: 'local', nameDisplay: 'local', isLocal: true
        },
        { id: 'c-1', nameDisplay: 'One' },
      ]);

      expect(result.map((o: any) => o.value)).not.toContain('local');
      expect(result.map((o: any) => o.value)).toContain('c-1');
    });
  });

  describe('scopePaginatedSettings (pagination on)', () => {
    it('maps raw clusters via spec.displayName, prepending "no scope"', () => {
      const wrapper = mountToken();
      const { updateResources } = wrapper.vm.scopePaginatedSettings;

      const result = updateResources([{ id: 'c-1', spec: { displayName: 'One' } }]);

      expect(result[0]).toStrictEqual(wrapper.vm.noScopeOption);
      expect(result[1]).toStrictEqual({ value: 'c-1', label: 'One' });
    });

    it('falls back to the cluster id when a display name is missing', () => {
      const wrapper = mountToken();
      const { updateResources } = wrapper.vm.scopePaginatedSettings;

      const result = updateResources([
        { id: 'c-2', spec: {} },
        { id: 'c-3' },
      ]);

      expect(result).toContainEqual({ value: 'c-2', label: 'c-2' });
      expect(result).toContainEqual({ value: 'c-3', label: 'c-3' });
    });

    it('is idempotent across accumulated pages (no duplicate "no scope", keeps already-mapped options)', () => {
      const wrapper = mountToken();
      const { noScopeOption } = wrapper.vm;
      const { updateResources } = wrapper.vm.scopePaginatedSettings;

      // Mimics a "load more": the previous (already transformed) page is passed back in, concatenated with new raw results
      const result = updateResources([
        noScopeOption,
        { value: 'c-1', label: 'One' },
        { id: 'c-2', spec: { displayName: 'Two' } },
      ]);

      expect(result.filter((o: any) => o.value === noScopeOption.value)).toHaveLength(1);
      expect(result[0]).toStrictEqual(noScopeOption);
      expect(result).toContainEqual({ value: 'c-1', label: 'One' });
      expect(result).toContainEqual({ value: 'c-2', label: 'Two' });
    });

    it('applies the cluster scope filters, disables namespace grouping and sorts by display name', () => {
      const wrapper = mountToken();
      const { requestSettings } = wrapper.vm.scopePaginatedSettings;

      const result = requestSettings({ opts: { filter: '' } });

      expect(result.groupByNamespace).toStrictEqual(false);
      expect(result.sort).toStrictEqual([{ asc: true, field: 'spec.displayName' }]);
      // paginationFilterClusters contributes the two harvester-exclusion filters (hide-local is off)
      expect(result.filters).toHaveLength(2);
    });

    it('adds a display-name search filter when the user types', () => {
      const wrapper = mountToken();
      const { requestSettings } = wrapper.vm.scopePaginatedSettings;
      const createSingleField = jest.spyOn(PaginationParamFilter, 'createSingleField');

      const result = requestSettings({ opts: { filter: 'prod' } });

      expect(createSingleField).toHaveBeenCalledWith({
        field: 'spec.displayName', value: 'prod', exact: false
      });
      // search filter + the two harvester-exclusion filters
      expect(result.filters).toHaveLength(3);
    });
  });
});
