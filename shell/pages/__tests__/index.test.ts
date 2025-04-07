import { mount, VueWrapper } from '@vue/test-utils';
import IndexPage from '@shell/pages/index.vue';

describe('page: index', () => {
  let wrapper: VueWrapper<any, any>;

  beforeEach(() => {
    wrapper = mount(IndexPage, {
      global: {
        mocks: {
          $route:  {},
          $router: { replace: jest.fn() },
          $store:  {
            getters: {
              'prefs/get':       jest.fn(),
              'management/byId': jest.fn(),
            }
          },
        }
      }
    });
  });

  it('should be rendered', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should redirect to stored last page from logout', async() => {
    const routerSpy = jest.fn();
    const backTo = '/whatever';
    const resolvedPath = { matched: [backTo] };

    jest.spyOn(Object.getPrototypeOf(localStorage), 'getItem').mockReturnValue(backTo);
    wrapper = mount(IndexPage, {
      global: {
        mocks: {
          $route:  {},
          $router: {
            replace: routerSpy,
            resolve: () => resolvedPath
          },
          $store: {
            getters: {
              'prefs/get':       () => '123',
              'management/byId': () => ({ value: '123' }),
            }
          },
        }
      }
    });

    expect(routerSpy).toHaveBeenCalledWith(resolvedPath);
  });
});
