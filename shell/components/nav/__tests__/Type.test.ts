import { shallowMount, RouterLinkStub, createLocalVue } from '@vue/test-utils';
import Type from '@shell/components/nav/Type.vue';
import { createChildRenderingRouterLinkStub } from '@shell/utils/unit-tests/ChildRenderingRouterLinkStub';
import { TYPE_MODES } from '@shell/store/type-map';

// Configuration
const activeClass = 'router-link-active';
const exactActiveClass = 'router-link-exact-active';
const rootClass = 'root';
const favoriteClass = 'favorite';

describe('component: Type', () => {
  describe('testing router-link type', () => {
    const localVue = createLocalVue();

    localVue.directive('cleanHtml', (identity) => identity);

    const defaultRouteTypeProp = {
      name:  'route-type',
      route: 'route',
      exact: true,
      mode:  TYPE_MODES.FAVORITE
    };

    const defaultCount = 1;
    const storeMock = {
      getters: {
        currentStore:    () => 'cluster',
        'cluster/count': () => defaultCount,
      }
    };

    describe('should pass props correctly', () => {
      it('should forward Type props to router-link', () => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     { routerLink: RouterLinkStub },
        });

        const linkStub = wrapper.findComponent(RouterLinkStub);

        expect(linkStub.props().to).toBe(defaultRouteTypeProp.route);
        expect(linkStub.props().exact).toBe(defaultRouteTypeProp.exact);
      });

      it('should use router-link-slot href prop', () => {
        const fakeHref = 'fake-href';
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     { routerLink: createChildRenderingRouterLinkStub({ href: fakeHref }) },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`a[href='${ fakeHref }']`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should use router-link-slot navigate prop', () => {
        const navigate = jest.fn();
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     { routerLink: createChildRenderingRouterLinkStub({ isActive: true, navigate }) },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`.${ activeClass }`);

        elementWithSelector.trigger('click');

        expect(navigate).toHaveBeenCalledTimes(1);
      });
    });

    describe('should not use classes if preconditions are not met', () => {
      it('should not use active class if the link is not active', () => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     { routerLink: createChildRenderingRouterLinkStub({ isActive: false }) },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`.${ activeClass }`);

        expect(elementWithSelector.exists()).toBe(false);
      });

      it('should not use exact active class if the link is not active', () => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     { routerLink: createChildRenderingRouterLinkStub({ isExactActive: false }) },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`.${ exactActiveClass }`);

        expect(elementWithSelector.exists()).toBe(false);
      });

      it('should not use root class if the isRoot prop is false', () => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp, isRoot: false },
          stubs:     { routerLink: createChildRenderingRouterLinkStub() },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`.${ rootClass }`);

        expect(elementWithSelector.exists()).toBe(false);
      });
    });

    describe('should use classes if preconditions are met', () => {
      it('should use active class if the link is active', () => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     { routerLink: createChildRenderingRouterLinkStub({ isActive: true }) },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`.${ activeClass }`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should use exact active class if the link is active', () => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     { routerLink: createChildRenderingRouterLinkStub({ isExactActive: true }) },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`.${ exactActiveClass }`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should use root class if the isRoot prop is true', () => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp, isRoot: true },
          stubs:     { routerLink: createChildRenderingRouterLinkStub() },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`.${ rootClass }`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should show depth-0 class if depth prop is not defined', () => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     { routerLink: createChildRenderingRouterLinkStub() },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`.depth-0`);

        expect(elementWithSelector.exists()).toBe(true);
      });

      it('should show depth-1 class if depth prop is defined as 1', () => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp, depth: 1 },
          stubs:     { routerLink: createChildRenderingRouterLinkStub() },
          mocks:     { $store: storeMock }
        });

        const elementWithSelector = wrapper.find(`.depth-1`);

        expect(elementWithSelector.exists()).toBe(true);
      });
    });

    describe('should handle the favorite icon appropriately', () => {
      it('should show favorite icon if mouse is over and type is favorite', async() => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     {
            routerLink: createChildRenderingRouterLinkStub(),
            Favorite:   { template: `<div class=${ favoriteClass } />` }
          },
          mocks: { $store: storeMock }
        });

        const aElement = wrapper.find(`a`);

        aElement.trigger('mouseenter');
        await wrapper.vm.$nextTick();

        const favoriteElement = wrapper.find(`.${ favoriteClass }`);

        expect(favoriteElement.exists()).toBe(true);
      });

      it('should not show favorite icon if mouse is not over and type is favorite', async() => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     {
            routerLink: createChildRenderingRouterLinkStub(),
            Favorite:   { template: `<div class=${ favoriteClass } />` }
          },
          mocks: { $store: storeMock }
        });

        const favoriteElement = wrapper.find(`.${ favoriteClass }`);

        expect(favoriteElement.exists()).toBe(false);
      });

      it('should not show favorite icon if mouse is over and type is not favorite', async() => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: { ...defaultRouteTypeProp, mode: null } },
          stubs:     {
            routerLink: createChildRenderingRouterLinkStub(),
            Favorite:   { template: `<div class=${ favoriteClass } />` }
          },
          mocks: { $store: storeMock }
        });

        const aElement = wrapper.find(`a`);

        aElement.trigger('mouseenter');
        await wrapper.vm.$nextTick();

        const favoriteElement = wrapper.find(`.${ favoriteClass }`);

        expect(favoriteElement.exists()).toBe(false);
      });
    });

    describe('should handle count appropriately', () => {
      it('should show count if on type', async() => {
        const count = 2;
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: { ...defaultRouteTypeProp, count } },
          stubs:     {
            routerLink: createChildRenderingRouterLinkStub(),
            Favorite:   { template: `<div class=${ favoriteClass } />` }
          },
          mocks: { $store: storeMock }
        });

        const typeCount = wrapper.find(`span[data-testid="type-count"]`);

        expect(Number.parseInt(typeCount.text())).toBe(count);
      });

      it('should show count if in store', async() => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     {
            routerLink: createChildRenderingRouterLinkStub(),
            Favorite:   { template: `<div class=${ favoriteClass } />` }
          },
          mocks: { $store: storeMock }
        });

        const typeCount = wrapper.find(`span[data-testid="type-count"]`);

        expect(Number.parseInt(typeCount.text())).toBe(defaultCount);
      });

      it('should not show count if not in type or store', async() => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: defaultRouteTypeProp },
          stubs:     {
            routerLink: createChildRenderingRouterLinkStub(),
            Favorite:   { template: `<div class=${ favoriteClass } />` }
          },
          mocks: {

            $store: {
              getters: {
                currentStore:    () => 'cluster',
                'cluster/count': () => null,
              }
            }
          }
        });

        const typeCount = wrapper.find(`span[data-testid="type-count"]`);

        expect(typeCount.exists()).toBe(false);
      });
    });

    describe('should handle namespace appropriately', () => {
      it('should show namespace if on type', async() => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: { ...defaultRouteTypeProp, namespaced: true } },
          stubs:     {
            routerLink: createChildRenderingRouterLinkStub(),
            Favorite:   { template: `<div class=${ favoriteClass } />` }
          },
          mocks: { $store: storeMock }
        });

        const namespaced = wrapper.find(`i[data-testid="type-namespaced"]`);

        expect(namespaced.exists()).toBe(true);
      });

      it('should not show namespace if not on type', async() => {
        const wrapper = shallowMount(Type as any, {
          localVue,
          propsData: { type: { ...defaultRouteTypeProp, namespaced: false } },
          stubs:     {
            routerLink: createChildRenderingRouterLinkStub(),
            Favorite:   { template: `<div class=${ favoriteClass } />` }
          },
          mocks: { $store: storeMock }
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
        propsData: { type: defaultLinkTypeProp },
        stubs:     {
          routerLink: createChildRenderingRouterLinkStub(),
          Favorite:   { template: `<div class=${ favoriteClass } />` }
        },
      });

      const link = wrapper.find(`li[data-testid="link-type"]`);

      expect(link.text()).toBe(defaultLinkTypeProp.label);
      expect(link.find('a').attributes('target')).toBe(defaultLinkTypeProp.target);
    });
  });
});

jest.restoreAllMocks();
