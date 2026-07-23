import { shallowMount } from '@vue/test-utils';
import Group from '@shell/components/nav/Group.vue';
import Type from '@shell/components/nav/Type.vue';

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
          $route: {
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

  /**
   * Regression guard for the nested-interactive a11y fix (issue #17260).
   *
   * PR #16352 introduced a pattern where root-group children are promoted to
   * top-level nav items with `children: []`. Group.vue must NOT render those
   * items as `role="button"`, because they already contain an <a> link via the
   * Type component — nesting an interactive element inside another interactive
   * element violates the nested-interactive WCAG rule.
   */
  describe('header role and ARIA attributes (nested-interactive a11y fix)', () => {
    const routerMocks = {
      $route: {
        params:   {},
        path:     '/test/route',
        fullPath: '/test/route',
        matched:  [],
      },
      $router: {
        resolve:   jest.fn().mockReturnValue({ path: '/test/route', fullPath: '/test/route' }),
        getRoutes: jest.fn().mockReturnValue([]),
      },
      t: (key: string) => key,
    };

    const mountGroupWithMocks = (group: any, extraProps: Record<string, unknown> = {}) => shallowMount(Group as any, {
      props: {
        group,
        canCollapse: true,
        idPrefix:    '',
        ...extraProps,
      },
      global: { mocks: routerMocks },
    });

    describe('when group has children (standard collapsible group)', () => {
      const group = {
        name:     'test',
        label:    'My Group',
        children: [{ route: { name: 'child-route', params: {} } }],
      };

      it('renders header with role="button"', () => {
        const wrapper = mountGroupWithMocks(group);

        expect(wrapper.find('.header').attributes('role')).toBe('button');
      });

      it('renders header with tabindex="0" when not fixedOpen', () => {
        const wrapper = mountGroupWithMocks(group);

        expect(wrapper.find('.header').attributes('tabindex')).toBe('0');
      });

      it('renders header with tabindex="-1" when fixedOpen is true', () => {
        const wrapper = mountGroupWithMocks(group, { fixedOpen: true });

        expect(wrapper.find('.header').attributes('tabindex')).toBe('-1');
      });

      it('renders header with aria-label from group label', () => {
        const wrapper = mountGroupWithMocks(group);

        expect(wrapper.find('.header').attributes('aria-label')).toBe('My Group');
      });

      it('renders header with aria-expanded attribute', () => {
        const wrapper = mountGroupWithMocks(group);

        expect(wrapper.find('.header').attributes('aria-expanded')).toBeDefined();
      });

      it('renders header with aria-controls pointing to group body', () => {
        const wrapper = mountGroupWithMocks(group);

        // id = idPrefix + group.name = '' + 'test' = 'test'
        expect(wrapper.find('.header').attributes('aria-controls')).toBe('group-test');
      });

      it('omits aria-controls when canCollapse is false', () => {
        const wrapper = mountGroupWithMocks(group, { canCollapse: false });

        expect(wrapper.find('.header').attributes('aria-controls')).toBeUndefined();
      });
    });

    describe('when group has no children (simple nav item, root group promotion from PR #16352)', () => {
      // Mirrors the data shape produced by SideNav.vue's root-group unpacking:
      //   rootGroup.children.forEach(child => addObject(out, { ...child, children: [] }))
      const group = {
        name:     'cluster-dashboard',
        label:    'Cluster',
        route:    { name: 'c-cluster-explorer', params: {} },
        children: [],
      };

      it.each([
        ['role'],
        ['tabindex'],
        ['aria-label'],
        ['aria-expanded'],
        ['aria-controls'],
      ])('does not set %s on the header div (avoids nested-interactive violation)', (attr) => {
        const wrapper = mountGroupWithMocks(group);

        expect(wrapper.find('.header').attributes(attr)).toBeUndefined();
      });

      it('still renders the Type component as the nav link', () => {
        const wrapper = mountGroupWithMocks(group);

        expect(wrapper.findComponent(Type).exists()).toBe(true);
      });

      it('passes the group object as the type prop to the Type component', () => {
        const wrapper = mountGroupWithMocks(group);

        expect(wrapper.findComponent(Type).props('type')).toStrictEqual(group);
      });
    });
  });
});
