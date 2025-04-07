
import { mount, VueWrapper } from '@vue/test-utils';
import Header from '@shell/components/nav/Header.vue';

describe('component: Header', () => {
  let wrapper: VueWrapper<any, any>;

  beforeEach(() => {
    wrapper = mount(Header, {
      global: {
        directives: { shortkey: jest.fn() },
        mocks:      {
          $config: { rancherEnv: 'whatever' },
          $route:  {}, // Used on logout
          $router: { push: jest.fn() }, // Used on logout
          $store:  {
            getters: {
              currentCluster:                 jest.fn(),
              'management/byId':              jest.fn(),
              'management/schemaFor':         jest.fn(),
              'rancher/schemaFor':            jest.fn(),
              'management/paginationEnabled': jest.fn(),
              'management/all':               jest.fn(),
              'prefs/get':                    jest.fn(),
              'rancher/byId':                 jest.fn(),
              isRancher:                      jest.fn(),
              isExplorer:                     jest.fn(),
              isRancherInHarvester:           jest.fn(),
              isMultiCluster:                 jest.fn(),
              isSingleProduct:                jest.fn(),
              currentProduct:                 jest.fn(),
              rootProduct:                    jest.fn(),
              pageActions:                    jest.fn(),
              clusterReady:                   jest.fn(),
              backToRancherLink:              jest.fn(),
              backToRancherGlobalLink:        jest.fn(),
              'i18n/withFallback':            jest.fn(),
            },
            dispatch: jest.fn(),
          }
        },
        stubs: {
          TopLevelMenu:  true,
          'router-link': true
        }
      }
    });
  });

  it('should be rendered', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('pressing logout should store current path', async() => {
    const pathname = '/whatever';
    const localStorageSpy = jest.spyOn(Object.getPrototypeOf(localStorage), 'setItem');

    Object.defineProperty(window, 'location', { value: new URL(`http://whatever${ pathname }`) } );

    // await wrapper.find('[data-testid="nav_header_showUserMenu"]').trigger('click');
    // await wrapper.find('[data-testid="nav_header_logout"]').trigger('click');
    wrapper.vm.handleLogout();

    expect(localStorageSpy).toHaveBeenLastCalledWith('backTo', pathname);
  });
});
