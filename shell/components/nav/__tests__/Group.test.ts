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
});
