import { shallowMount } from '@vue/test-utils';
import Group from '@shell/components/nav/Group.vue';

describe('component: Group', () => {
  it('isOverview ignores query parameters and hash strings when checking active state', () => {
    const group = {
      name:     'test',
      children: [
        {
          route:    { name: 'overview-route' },
          overview: true
        }
      ]
    };

    const wrapper = shallowMount(Group as any, {
      props: {
        group, canCollapse: true, idPrefix: ''
      },
      global: {
        mocks: {
          $route:  { path: '/test/route', fullPath: '/test/route?query=val#hash' },
          $router: {
            resolve:   jest.fn().mockReturnValue({ path: '/test/route', fullPath: '/test/route' }),
            getRoutes: jest.fn().mockReturnValue([])
          },
          t: (key: string) => key
        }
      }
    });

    expect((wrapper.vm as any).isOverview).toBe(true);
  });

  it('hasActiveRoute ignores query parameters when checking item paths', () => {
    const group = {
      name:     'test',
      children: [
        { route: { name: 'child-route', params: {} } }
      ]
    };

    const wrapper = shallowMount(Group as any, {
      props: {
        group, canCollapse: true, idPrefix: ''
      },
      global: {
        mocks: {
          $route: {
            params:   {},
            hash:     '#hash',
            path:     '/child/route',
            fullPath: '/child/route?query=val#hash',
            matched:  []
          },
          $router: {
            resolve:   jest.fn().mockReturnValue({ path: '/child/route', fullPath: '/child/route' }),
            getRoutes: jest.fn().mockReturnValue([])
          },
          t: (key: string) => key
        }
      }
    });

    expect((wrapper.vm as any).hasActiveRoute()).toBe(true);
  });

  describe('group header label', () => {
    const mountGroup = (group: any) => shallowMount(Group as any, {
      props: {
        group, canCollapse: true, idPrefix: ''
      },
      global: {
        stubs: { 'router-link': { template: '<a><slot /></a>' } },
        mocks: {
          $route:  {
            params: {}, path: '/test/route', fullPath: '/test/route', matched: []
          },
          $router: {
            resolve:   jest.fn().mockReturnValue({ path: '/test/route', fullPath: '/test/route' }),
            getRoutes: jest.fn().mockReturnValue([])
          },
          t: (key: string) => key
        }
      }
    });

    it('renders the label in an h6 for a non-linked group header', () => {
      const group = {
        name:     'test',
        label:    'My Group',
        children: [
          { route: { name: 'child-route', params: {} } }
        ]
      };

      const wrapper = mountGroup(group);
      const header = wrapper.find('.header');
      const h6 = header.find('h6');

      // Non-linked header: the label sits in a bare h6, not wrapped in a router-link
      expect(header.find('a').exists()).toBe(false);
      expect(h6.exists()).toBe(true);
      expect(h6.find('span').html()).toContain('My Group');
    });

    it('renders the label in an h6 wrapped in a router-link for a group header with overview', () => {
      const group = {
        name:     'test',
        label:    'My Group',
        children: [
          {
            route: { name: 'overview-route' }, overview: true, exact: true
          }
        ]
      };

      const wrapper = mountGroup(group);
      const link = wrapper.find('.header a');
      const h6 = link.find('h6');

      // Linked header: the same h6 label markup is wrapped in a router-link
      expect(link.exists()).toBe(true);
      expect(h6.exists()).toBe(true);
      expect(h6.find('span').html()).toContain('My Group');
    });
  });
});
