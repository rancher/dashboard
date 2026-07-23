import { guardExtensionRoute } from '@shell/config/router/navigation-guards/extension-route-guard';

const PRODUCT = 'my-product';
const GATED_ROUTE = 'c-cluster-my-product-gated';
const OPEN_ROUTE = 'c-cluster-my-product-open';
const UNKNOWN_ROUTE = 'c-cluster-my-product-unknown';

const gatedVirtualType = {
  name:      'my-gated-type',
  route:     { name: GATED_ROUTE },
  ifFeature: 'some-feature',
};

const openVirtualType = {
  name:  'my-open-type',
  route: { name: OPEN_ROUTE },
};

function makeStore({ allTypesResult = {} }: { allTypesResult?: Record<string, any> } = {}) {
  return {
    state: {
      'type-map': {
        products:     [{ name: PRODUCT, inStore: 'cluster' }],
        virtualTypes: { [PRODUCT]: [gatedVirtualType, openVirtualType] },
      },
    },
    getters: { 'type-map/allTypes': jest.fn(() => allTypesResult) },
  };
}

function makeRoute(name: string, meta: Record<string, any> = {}) {
  return { name, meta };
}

describe('navigation-guards/extension-route-guard', () => {
  describe('non-extension routes', () => {
    it('allows routes without _extensionRoute meta', async() => {
      const next = jest.fn();
      const store = makeStore();

      await guardExtensionRoute(makeRoute(GATED_ROUTE), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.objectContaining({ name: '404' }));
    });
  });

  describe('timing bail-out', () => {
    it('allows when products are not yet loaded', async() => {
      const next = jest.fn();
      const store = {
        state:   { 'type-map': { products: [] } },
        getters: {},
      };

      await guardExtensionRoute(makeRoute(GATED_ROUTE, { _extensionRoute: true }), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith();
    });

    it('allows when type-map state is absent', async() => {
      const next = jest.fn();
      const store = {
        state:   {},
        getters: {},
      };

      await guardExtensionRoute(makeRoute(GATED_ROUTE, { _extensionRoute: true }), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('extension routes with no matching virtualType', () => {
    it('allows pure extension routes that have no virtualType registration', async() => {
      const next = jest.fn();
      const store = makeStore();

      await guardExtensionRoute(makeRoute(UNKNOWN_ROUTE, { _extensionRoute: true }), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('extension routes with a matching virtualType but no conditions', () => {
    it('allows unconditional virtualType routes', async() => {
      const next = jest.fn();
      const store = makeStore();

      await guardExtensionRoute(makeRoute(OPEN_ROUTE, { _extensionRoute: true }), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('extension routes with a gated virtualType', () => {
    it('allows when virtualType appears in allTypes (conditions met)', async() => {
      const next = jest.fn();
      const store = makeStore({ allTypesResult: { all: { 'my-gated-type': gatedVirtualType } } });

      await guardExtensionRoute(makeRoute(GATED_ROUTE, { _extensionRoute: true }), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.objectContaining({ name: '404' }));
    });

    it('redirects to 404 when virtualType is absent from allTypes (conditions not met)', async() => {
      const next = jest.fn();
      const store = makeStore({ allTypesResult: {} });

      await guardExtensionRoute(makeRoute(GATED_ROUTE, { _extensionRoute: true }), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith({ name: '404' });
    });

    it('redirects to 404 when only unrelated types appear in allTypes', async() => {
      const next = jest.fn();
      const store = makeStore({ allTypesResult: { all: { 'some-other-type': { name: 'some-other-type' } } } });

      await guardExtensionRoute(makeRoute(GATED_ROUTE, { _extensionRoute: true }), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith({ name: '404' });
    });
  });

  describe('multi-product setup', () => {
    it('finds the correct virtualType across multiple products', async() => {
      const next = jest.fn();
      const OTHER_PRODUCT = 'other-product';
      const store = {
        state: {
          'type-map': {
            products:     [{ name: OTHER_PRODUCT, inStore: 'cluster' }, { name: PRODUCT, inStore: 'cluster' }],
            virtualTypes: {
              [OTHER_PRODUCT]: [],
              [PRODUCT]:       [gatedVirtualType],
            },
          },
        },
        getters: { 'type-map/allTypes': jest.fn(() => ({})) },
      };

      await guardExtensionRoute(makeRoute(GATED_ROUTE, { _extensionRoute: true }), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith({ name: '404' });
      expect(store.getters['type-map/allTypes']).toHaveBeenCalledWith(PRODUCT);
    });
  });

  describe('ifRancherCluster condition', () => {
    it('treats ifRancherCluster: false as a condition and enforces the gate', async() => {
      const next = jest.fn();
      const rancherClusterVt = {
        name:             'my-rancher-type',
        route:            { name: 'c-cluster-my-product-rancher' },
        ifRancherCluster: false,
      };
      const store = {
        state: {
          'type-map': {
            products:     [{ name: PRODUCT, inStore: 'cluster' }],
            virtualTypes: { [PRODUCT]: [rancherClusterVt] },
          },
        },
        getters: { 'type-map/allTypes': jest.fn(() => ({})) },
      };

      await guardExtensionRoute(makeRoute('c-cluster-my-product-rancher', { _extensionRoute: true }), {}, next, { store } as any);

      expect(next).toHaveBeenCalledWith({ name: '404' });
    });
  });
});
