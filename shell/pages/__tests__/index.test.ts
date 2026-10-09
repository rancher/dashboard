import { shallowMount } from '@vue/test-utils';
import Index from '@shell/pages/index.vue';
import { SEEN_WHATS_NEW } from '@shell/store/prefs';

jest.mock('@shell/utils/version', () => ({ getVersionInfo: () => ({ fullVersion: 'v2.17.0' }) }));

const createStore = ({ afterLoginRoute = { name: 'home' } as any, seenWhatsNew = 'v2.17.0', authRedirect = null as any } = {}) => ({
  state:   { prefs: { authRedirect } },
  getters: {
    'prefs/get':             (key: string) => (key === SEEN_WHATS_NEW ? seenWhatsNew : undefined),
    'prefs/afterLoginRoute': afterLoginRoute,
    isSingleProduct:         undefined,
  },
  commit: jest.fn(),
});

const createRouter = () => ({
  resolve: jest.fn((route: any) => ({ fullPath: `/${ route.name }`, matched: [{}] })),
  replace: jest.fn(),
});

const mountIndex = (store: any, router: any) => shallowMount(Index, { global: { mocks: { $store: store, $router: router } } });

describe('page: index', () => {
  it('redirects to the after login route', () => {
    const route = { name: 'c-cluster-explorer', params: { cluster: 'local' } };
    const store = createStore({ afterLoginRoute: route });
    const router = createRouter();

    mountIndex(store, router);

    expect(router.replace).toHaveBeenCalledWith(route);
  });

  it('clears the page requested before login once it is used', () => {
    const store = createStore();
    const router = createRouter();

    mountIndex(store, router);

    expect(store.commit).toHaveBeenCalledWith('prefs/setAuthRedirect', null);
  });

  it('clears the page requested before login when redirecting to the release notes', () => {
    const store = createStore({ seenWhatsNew: 'v2.16.0' });
    const router = createRouter();

    mountIndex(store, router);

    expect(store.commit).toHaveBeenCalledWith('prefs/setAuthRedirect', null);
  });

  it('redirects to the home page when there are unseen release notes', () => {
    const store = createStore({ afterLoginRoute: { name: 'c-cluster-explorer' }, seenWhatsNew: 'v2.16.0' });
    const router = createRouter();

    mountIndex(store, router);

    expect(router.replace).toHaveBeenCalledWith({ name: 'home' });
  });

  it('redirects to the page requested before login even when there are unseen release notes', () => {
    const bookmark = {
      name:   'c-cluster-product-resource',
      params: {
        cluster: 'local', product: 'explorer', resource: 'node'
      }
    };
    const store = createStore({
      afterLoginRoute: bookmark, seenWhatsNew: 'v2.16.0', authRedirect: bookmark
    });
    const router = createRouter();

    mountIndex(store, router);

    expect(router.replace).toHaveBeenCalledWith(bookmark);
  });

  it('redirects to the home page when the after login route is invalid', () => {
    const store = createStore({ afterLoginRoute: { name: 'uninstalled-extension-page' } });
    const router = createRouter();

    router.resolve.mockImplementation(() => ({ fullPath: '/uninstalled', matched: [] }));

    mountIndex(store, router);

    expect(router.replace).toHaveBeenCalledWith({ name: 'home' });
  });
});
