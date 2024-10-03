import { nextTick } from 'vue';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import Type from '@shell/components/nav/Type.vue';
import { createChildRenderingRouterLinkStub } from '@shell/utils/unit-tests/ChildRenderingRouterLinkStub';
import { TYPE_MODES } from '@shell/store/type-map.js';

// Configuration
const activeClass = 'router-link-active';
const exactActiveClass = 'router-link-exact-active';
const rootClass = 'root';
const favoriteClass = 'favorite';

describe('component: Type', () => {
  describe('testing router-link type', () => {
    const defaultRouteTypeProp = {
      name:  'route-type',
      route: 'route',
      mode:  TYPE_MODES.FAVORITE
    };

    const defaultCount = 1;
    const storeMock = {
      getters: {
        currentStore:    () => 'cluster',
        'cluster/count': () => defaultCount,
      }
    };
    const routerMock = {
      resolve: jest.fn((route) => {
        return { fullPath: route };
      })
    };
    const routeMock = { fullPath: 'route' };

    describe('should pass props correctly', () => {
      it('should forward Type props to router-link', () => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },
            mocks:      {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: RouterLinkStub },
          },
        });

        const linkStub = wrapper.findComponent(RouterLinkStub);

        expect(linkStub.props().to).toBe(defaultRouteTypeProp.route);
      });

      it('should use router-link-slot href prop', () => {
        const fakeHref = 'fake-href';
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub({ href: fakeHref }) },
          },
        });

        const elementWithSelector = wrapper.find(`a[href='${ fakeHref }']`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should use router-link-slot navigate prop', () => {
        const navigate = jest.fn();
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub({ navigate }) },
          },
        });

        const elementWithSelector = wrapper.find(`.${ activeClass }`);

        elementWithSelector.trigger('click');

        expect(navigate).toHaveBeenCalledTimes(1);
      });
    });

    describe('should not use classes if preconditions are not met', () => {
      it('should not use active class if the link is not active', () => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: { fullPath: 'bad' }
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub() },
          },
        });

        const elementWithSelector = wrapper.find(`.${ activeClass }`);

        expect(elementWithSelector.exists()).toBe(false);
      });

      it('should not use exact active class if the link is not active', () => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub({ isExactActive: false }) },
          },
        });

        const elementWithSelector = wrapper.find(`.${ exactActiveClass }`);

        expect(elementWithSelector.exists()).toBe(false);
      });

      it('should not use root class if the isRoot prop is false', () => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp, isRoot: false },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub() },
          },
        });

        const elementWithSelector = wrapper.find(`.${ rootClass }`);

        expect(elementWithSelector.exists()).toBe(false);
      });
    });

    describe('should use classes if preconditions are met', () => {
      it('should use active class if the link is active', () => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub() },
          },
        });

        const elementWithSelector = wrapper.find(`.${ activeClass }`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should use exact active class if the link is active', () => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub({ isExactActive: true }) },
          },
        });

        const elementWithSelector = wrapper.find(`.${ exactActiveClass }`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should use root class if the isRoot prop is true', () => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp, isRoot: true },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub() },
          },
        });

        const elementWithSelector = wrapper.find(`.${ rootClass }`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should show depth-0 class if depth prop is not defined', () => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub() },
          },
        });

        const elementWithSelector = wrapper.find(`.depth-0`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should show depth-1 class if depth prop is defined as 1', () => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp, depth: 1 },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },
            stubs: { routerLink: createChildRenderingRouterLinkStub() },
          },
        });

        const elementWithSelector = wrapper.find(`.depth-1`);

        expect(elementWithSelector.exists()).toBe(true);
      });
    });

    describe('should handle the favorite icon appropriately', () => {
      it('should show favorite icon if mouse is over and type is favorite', async() => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },

            stubs: {
              routerLink: createChildRenderingRouterLinkStub(),
              Favorite:   { template: `<div class=${ favoriteClass } />` }
            },
          },
        });

        const aElement = wrapper.find(`a`);

        aElement.trigger('mouseenter');
        await nextTick();

        const favoriteElement = wrapper.find(`.${ favoriteClass }`);

        expect(favoriteElement.exists()).toBe(true);
      });

      it('should not show favorite icon if mouse is not over and type is favorite', async() => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },

            stubs: {
              routerLink: createChildRenderingRouterLinkStub(),
              Favorite:   { template: `<div class=${ favoriteClass } />` }
            },
          },
        });

        const favoriteElement = wrapper.find(`.${ favoriteClass }`);

        expect(favoriteElement.exists()).toBe(false);
      });

      it('should not show favorite icon if mouse is over and type is not favorite', async() => {
        const wrapper = shallowMount(Type as any, {
          props: { type: { ...defaultRouteTypeProp, mode: null } },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },

            stubs: {
              routerLink: createChildRenderingRouterLinkStub(),
              Favorite:   { template: `<div class=${ favoriteClass } />` }
            },
          },
        });

        const aElement = wrapper.find(`a`);

        aElement.trigger('mouseenter');
        await nextTick();

        const favoriteElement = wrapper.find(`.${ favoriteClass }`);

        expect(favoriteElement.exists()).toBe(false);
      });
    });

    describe('should handle count appropriately', () => {
      it('should show count if on type', async() => {
        const count = 2;
        const wrapper = shallowMount(Type as any, {
          props: { type: { ...defaultRouteTypeProp, count } },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },

            stubs: {
              routerLink: createChildRenderingRouterLinkStub(),
              Favorite:   { template: `<div class=${ favoriteClass } />` }
            },
          },
        });

        const typeCount = wrapper.find(`span[data-testid="type-count"]`);

        expect(Number.parseInt(typeCount.text())).toBe(count);
      });

      it('should show count if in store', async() => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },

            stubs: {
              routerLink: createChildRenderingRouterLinkStub(),
              Favorite:   { template: `<div class=${ favoriteClass } />` }
            },
          },
        });

        const typeCount = wrapper.find(`span[data-testid="type-count"]`);

        expect(Number.parseInt(typeCount.text())).toBe(defaultCount);
      });

      it('should not show count if not in type or store', async() => {
        const wrapper = shallowMount(Type as any, {
          props: { type: defaultRouteTypeProp },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {

              $store: {
                getters: {
                  currentStore:    () => 'cluster',
                  'cluster/count': () => null,
                }
              },
              $router: routerMock,
              $route:  routeMock
            },

            stubs: {
              routerLink: createChildRenderingRouterLinkStub(),
              Favorite:   { template: `<div class=${ favoriteClass } />` }
            },
          },
        });

        const typeCount = wrapper.find(`span[data-testid="type-count"]`);

        expect(typeCount.exists()).toBe(false);
      });
    });

    describe('should handle namespace appropriately', () => {
      it('should show namespace if on type', async() => {
        const wrapper = shallowMount(Type as any, {
          props: { type: { ...defaultRouteTypeProp, namespaced: true } },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },

            stubs: {
              routerLink: createChildRenderingRouterLinkStub(),
              Favorite:   { template: `<div class=${ favoriteClass } />` }
            },
          },
        });

        const namespaced = wrapper.find(`i[data-testid="type-namespaced"]`);

        expect(namespaced.exists()).toBe(true);
      });

      it('should not show namespace if not on type', async() => {
        const wrapper = shallowMount(Type as any, {
          props: { type: { ...defaultRouteTypeProp, namespaced: false } },

          global: {
            directives: { cleanHtml: (identity) => identity },

            mocks: {
              $store: storeMock, $router: routerMock, $route: routeMock
            },

            stubs: {
              routerLink: createChildRenderingRouterLinkStub(),
              Favorite:   { template: `<div class=${ favoriteClass } />` }
            },
          },
        });

        const namespaced = wrapper.find(`i[data-testid="type-namespaced"]`);

        expect(namespaced.exists()).toBe(false);
      });
    });
  });

  describe('testing link type', () => {
    it('should show the link type element if link is present on type with the specified label and target', () => {
      const defaultLinkTypeProp = {
        link:   'link-type-link',
        label:  'link-type-label',
        target: 'link-type-target'
      };

      const wrapper = shallowMount(Type as any, {
        props:  { type: defaultLinkTypeProp },
        global: {
          directives: { cleanHtml: (identity) => identity },

          stubs: {
            routerLink: createChildRenderingRouterLinkStub(),
            Favorite:   { template: `<div class=${ favoriteClass } />` }
          },
        },
      });

      const link = wrapper.find(`li[data-testid="link-type"]`);

      expect(link.text()).toBe(defaultLinkTypeProp.label);
      expect(link.find('a').attributes('target')).toBe(defaultLinkTypeProp.target);
    });
  });
});

jest.restoreAllMocks();
