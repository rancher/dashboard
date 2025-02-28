import { _VIEW } from '@shell/config/query-params';
import { mount, RouterLinkStub } from '@vue/test-utils';
import Header from '@shell/components/nav/Header.vue';

const mockStore = (opt: any) => ({
  dispatch: jest.fn(),
  getters:  {
    'i18n/t':                       (text: string) => text,
    'i18n/withFallback':            jest.fn(),
    currentProduct:                 { inStore: 'cluster', showWorkspaceSwitcher: opt.showWorkspaceSwitcher },
    currentStore:                   () => 'current_store',
    currentCluster:                 { id: 'local' },
    isSingleProduct:                () => false,
    isRancherInHarvester:           () => false,
    'rancher/byId':                 jest.fn(),
    'current_store/schemaFor':      jest.fn(),
    'current_store/all':            jest.fn(),
    'management/all':               () => [],
    'management/byId':              jest.fn(),
    'management/schemaFor':         jest.fn(),
    'management/paginationEnabled': () => false,
    'prefs/get':                    () => {},
    'prefs/theme':                  jest.fn(),
    rootProduct:                    jest.fn(),
    pageActions:                    jest.fn(),
    clusterId:                      jest.fn(),
    clusterReady:                   () => true,
    isExplorer:                     false,
  }
});

const requiredSetup = (opt: any) => {
  return {
    global: {
      mocks: {
        $config:     {},
        $store:      mockStore(opt),
        $route:      opt.route,
        $fetchState: { pending: false },
      },
      stubs: {
        'router-link':     RouterLinkStub,
        WorkspaceSwitcher: true,
      },
      directives: { shortkey: () => {} },
    }
  };
};

describe('component: Header', () => {
  describe('element WorkspaceSwitcher should be:', () => {
    it.each([
      ['visible if showWorkspaceSwitcher: true', true],
      ['hidden if showWorkspaceSwitcher: false', false]
    ])('%p *', (_, showWorkspaceSwitcher) => {
      const wrapper = mount(Header, {
        ...requiredSetup({ showWorkspaceSwitcher, route: 'c-cluster-route' }),
        props: {
          value: {},
          mode:  _VIEW
        },
      });

      const workspaceSwitcher = wrapper.find('[data-testid="header-workspace-switcher"]');

      expect(workspaceSwitcher.exists()).toBe(showWorkspaceSwitcher);
    });

    it.each([
      ['enabled if route is not a resource details page', { name: 'foo' }, false],
      ['disabled if route is a resource details page by id', { name: 'c-cluster-product-resource-id' }, true],
      ['disabled if route is a resource details page by namespace, id', { name: 'c-cluster-product-resource-namespace-id' }, true],
    ])('%p _', (
      _,
      route,
      disabledProp,
    ) => {
      const wrapper = mount(Header, {
        ...requiredSetup({ showWorkspaceSwitcher: true, route }),
        props: {
          value: {},
          mode:  _VIEW
        },
      });

      const workspaceSwitcher = wrapper.findComponent('[data-testid="header-workspace-switcher"]');
      const workspaceSwitcherDisabledProp = (workspaceSwitcher as any).vm.disabled;

      expect(workspaceSwitcherDisabledProp).toBe(disabledProp);
    });
  });
});
