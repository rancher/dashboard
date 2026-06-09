import CspAdapterUtils from '@shell/utils/cspAdaptor';
import { CATALOG } from '@shell/config/types';

type App = { metadata?: { name?: string } };

function makeStore({
  canList = true,
  paginationEnabled = false,
  findAllResult = [] as App[],
  findPageData = [] as App[],
} = {}) {
  return {
    getters: {
      'management/canList':           jest.fn().mockReturnValue(canList),
      'management/paginationEnabled': jest.fn().mockReturnValue(paginationEnabled),
    },
    dispatch: jest.fn((action: string) => {
      if (action === 'management/findAll') {
        return Promise.resolve(findAllResult);
      }
      if (action === 'management/findPage') {
        return Promise.resolve({ data: findPageData });
      }

      return Promise.resolve(null);
    }),
  };
}

describe('cspAdaptor', () => {
  describe('hasCspAdapter', () => {
    it.each([
      {
        desc:     'returns the matching app for rancher-csp-adapter',
        apps:     [{ metadata: { name: 'rancher-csp-adapter' } }, { metadata: { name: 'other-app' } }],
        expected: { metadata: { name: 'rancher-csp-adapter' } },
      },
      {
        desc:     'returns the matching app for rancher-csp-billing-adapter',
        apps:     [{ metadata: { name: 'rancher-csp-billing-adapter' } }],
        expected: { metadata: { name: 'rancher-csp-billing-adapter' } },
      },
      {
        desc:     'returns first match when multiple csp apps are present',
        apps:     [{ metadata: { name: 'rancher-csp-billing-adapter' } }, { metadata: { name: 'rancher-csp-adapter' } }],
        expected: { metadata: { name: 'rancher-csp-billing-adapter' } },
      },
      {
        desc:     'returns undefined when no app name matches',
        apps:     [{ metadata: { name: 'unrelated-app' } }],
        expected: undefined,
      },
      {
        desc:     'returns undefined for apps without metadata',
        apps:     [{}],
        expected: undefined,
      },
      {
        desc:     'returns undefined when apps is an empty array',
        apps:     [],
        expected: undefined,
      },
      {
        desc:     'returns undefined when apps is null',
        apps:     null as unknown as App[],
        expected: undefined,
      },
      {
        desc:     'returns undefined when apps is undefined',
        apps:     undefined as unknown as App[],
        expected: undefined,
      },
    ])('$desc', ({ apps, expected }) => {
      const result = CspAdapterUtils.hasCspAdapter({ $store: {} as any, apps });

      expect(result).toStrictEqual(expected);
    });
  });

  describe('fetchCspAdaptorApp', () => {
    beforeEach(() => {
      CspAdapterUtils.resetState();
    });

    it('returns empty array when canList returns false', async() => {
      const store = makeStore({ canList: false });
      const result = await CspAdapterUtils.fetchCspAdaptorApp(store as any);

      expect(result).toStrictEqual([]);
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('uses findAll when canList is true and pagination is disabled', async() => {
      const findAllResult: App[] = [{ metadata: { name: 'rancher-csp-adapter' } }];
      const store = makeStore({
        canList: true, paginationEnabled: false, findAllResult
      });

      const result = await CspAdapterUtils.fetchCspAdaptorApp(store as any);

      expect(result).toStrictEqual(findAllResult);
      expect(store.dispatch).toHaveBeenCalledWith('management/findAll', { type: CATALOG.APP });
    });

    it('uses findPage when canList is true and pagination is enabled', async() => {
      const findPageData: App[] = [{ metadata: { name: 'rancher-csp-billing-adapter' } }];
      const store = makeStore({
        canList: true, paginationEnabled: true, findPageData
      });

      const result = await CspAdapterUtils.fetchCspAdaptorApp(store as any);

      expect(result).toStrictEqual(findPageData);
      expect(store.dispatch).toHaveBeenCalledWith('management/findPage', expect.objectContaining({ type: CATALOG.APP }));
    });

    it('caches the result and does not dispatch again on a second call', async() => {
      const findAllResult: App[] = [{ metadata: { name: 'rancher-csp-adapter' } }];
      const store = makeStore({
        canList: true, paginationEnabled: false, findAllResult
      });

      await CspAdapterUtils.fetchCspAdaptorApp(store as any);
      const result = await CspAdapterUtils.fetchCspAdaptorApp(store as any);

      expect(result).toStrictEqual(findAllResult);
      expect(store.dispatch).toHaveBeenCalledTimes(1);
    });

    it('fetches fresh data after resetState clears the cache', async() => {
      const findAllResult: App[] = [{ metadata: { name: 'rancher-csp-adapter' } }];
      const store = makeStore({
        canList: true, paginationEnabled: false, findAllResult
      });

      await CspAdapterUtils.fetchCspAdaptorApp(store as any);

      CspAdapterUtils.resetState();

      const freshStore = makeStore({
        canList: true, paginationEnabled: false, findAllResult: []
      });
      const result = await CspAdapterUtils.fetchCspAdaptorApp(freshStore as any);

      expect(result).toStrictEqual([]);
      expect(freshStore.dispatch).toHaveBeenCalledTimes(1);
    });

    it('passes pagination filters for known csp adapter app names when using findPage', async() => {
      const store = makeStore({
        canList: true, paginationEnabled: true, findPageData: []
      });

      await CspAdapterUtils.fetchCspAdaptorApp(store as any);

      const [, args] = store.dispatch.mock.calls[0];

      expect(args.type).toStrictEqual(CATALOG.APP);
      expect(args.opt.watch).toStrictEqual(false);
      expect(args.opt.transient).toStrictEqual(true);
    });
  });
});
