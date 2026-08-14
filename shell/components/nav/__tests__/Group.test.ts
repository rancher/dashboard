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

  it('hasActiveRoute stays true on a route for a resource a child claims via navResources', () => {
    const group = {
      name:     'cluster',
      children: [
        {
          name:         'projects-namespaces',
          route:        { name: 'c-cluster-product-projectsnamespaces', params: { cluster: 'local', product: 'explorer' } },
          navResources: ['management.cattle.io.project']
        }
      ]
    };

    const wrapper = shallowMount(Group as any, {
      props: {
        group, canCollapse: true, idPrefix: ''
      },
      global: {
        mocks: {
          // Creating a project uses the generic resource create route, which no nav item links to
          $route: {
            params: {
              cluster: 'local', product: 'explorer', resource: 'management.cattle.io.project'
            },
            path:     '/c/local/explorer/management.cattle.io.project/create',
            fullPath: '/c/local/explorer/management.cattle.io.project/create',
            matched:  []
          },
          $router: {
            resolve:   jest.fn().mockReturnValue({ path: '/c/local/explorer/projectsnamespaces' }),
            getRoutes: jest.fn().mockReturnValue([])
          },
          t: (key: string) => key
        }
      }
    });

    expect((wrapper.vm as any).hasActiveRoute()).toBe(true);
  });

  it('hasActiveRoute is false on a route for a resource no child claims', () => {
    const group = {
      name:     'cluster',
      children: [
        {
          name:         'projects-namespaces',
          route:        { name: 'c-cluster-product-projectsnamespaces', params: { cluster: 'local', product: 'explorer' } },
          navResources: ['management.cattle.io.project']
        }
      ]
    };

    const wrapper = shallowMount(Group as any, {
      props: {
        group, canCollapse: true, idPrefix: ''
      },
      global: {
        mocks: {
          $route: {
            params: {
              cluster: 'local', product: 'explorer', resource: 'apps.deployment'
            },
            path:     '/c/local/explorer/apps.deployment/create',
            fullPath: '/c/local/explorer/apps.deployment/create',
            matched:  []
          },
          $router: {
            resolve:   jest.fn().mockReturnValue({ path: '/c/local/explorer/projectsnamespaces' }),
            getRoutes: jest.fn().mockReturnValue([])
          },
          t: (key: string) => key
        }
      }
    });

    expect((wrapper.vm as any).hasActiveRoute()).toBe(false);
  });

  it('hasActiveRoute stays true on a page nested under a child route', () => {
    // The Providers group in Cluster Management. There is no current cluster under /c/_, so nav items
    // resolve without a cluster param and the nav level check can't match on its own
    const group = {
      name:     'providers',
      children: [
        { name: 'rke-kontainer-providers', route: { name: 'c-cluster-manager-driver-kontainerdriver', params: {} } },
        { name: 'rke-node-providers', route: { name: 'c-cluster-manager-driver-nodedriver', params: {} } }
      ]
    };

    const mountOnPath = (path: string) => shallowMount(Group as any, {
      props: {
        group, canCollapse: true, idPrefix: ''
      },
      global: {
        mocks: {
          $route: {
            params: { cluster: '_' }, path, matched: []
          },
          $router: {
            resolve:   jest.fn((route: any) => ({ path: route.name === 'c-cluster-manager-driver-kontainerdriver' ? '/c/_/manager/kontainerDriver' : '/c/_/manager/nodeDriver' })),
            getRoutes: jest.fn().mockReturnValue([])
          },
          t: (key: string) => key
        }
      }
    });

    expect((mountOnPath('/c/_/manager/kontainerDriver').vm as any).hasActiveRoute()).toBe(true);
    // Clicking Create must not collapse the group out from under the highlighted child
    expect((mountOnPath('/c/_/manager/kontainerDriver/create').vm as any).hasActiveRoute()).toBe(true);
    expect((mountOnPath('/c/_/manager/hostedprovider').vm as any).hasActiveRoute()).toBe(false);
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

    const mountGroupWithMocks = (group: any, extraProps: Record<string, unknown> = {}, stubs: Record<string, unknown> = {}) => shallowMount(Group as any, {
      props: {
        group,
        canCollapse: true,
        idPrefix:    '',
        ...extraProps,
      },
      global: { mocks: routerMocks, stubs },
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

      it('renders header with tabindex="0"', () => {
        const wrapper = mountGroupWithMocks(group);

        expect(wrapper.find('.header').attributes('tabindex')).toBe('0');
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

    describe('when group has children AND an overview link (nested-interactive regression guard)', () => {
      const group = {
        name:     'cluster',
        label:    'Cluster',
        children: [
          {
            route: { name: 'c-cluster-explorer', params: {} }, overview: true, exact: true
          },
          { route: { name: 'c-cluster-workloads', params: {} } },
        ],
      };

      it.each([
        ['role'],
        ['tabindex'],
        ['aria-label'],
        ['aria-expanded'],
        ['aria-controls'],
      ])('does not set %s on the header div when group has an overview link', (attr) => {
        const wrapper = mountGroupWithMocks(group);

        expect(wrapper.find('.header').attributes(attr)).toBeUndefined();
      });

      it('renders the overview router-link without tabindex', () => {
        const wrapper = mountGroupWithMocks(group, {}, { 'router-link': { template: '<a><slot /></a>' } });
        const link = wrapper.find('.header a');

        expect(link.exists()).toBe(true);
        expect(link.attributes('tabindex')).toBeUndefined();
      });
    });
  });

  describe('expand/collapse state lives on the group', () => {
    const group = () => ({
      name:     'workloads',
      label:    'Workloads',
      children: [{ route: { name: 'child-route', params: {} } }],
    });

    const mountForToggle = (grp: any) => shallowMount(Group as any, {
      props: {
        group: grp, canCollapse: true, idPrefix: '',
      },
      global: {
        mocks: {
          $route: {
            params: {}, path: '/test', fullPath: '/test', matched: [],
          },
          $router: {
            resolve:   jest.fn().mockReturnValue({ path: '/test', fullPath: '/test' }),
            getRoutes: jest.fn().mockReturnValue([]),
          },
          t: (key: string) => key,
        },
      },
    });

    it('renders expanded when the group it is given is expanded', () => {
      const wrapper = mountForToggle({ ...group(), expanded: true });

      expect((wrapper.vm as any).isExpanded).toBe(true);
      expect(wrapper.find('.body').exists()).toBe(true);
    });

    it('renders collapsed when the group it is given is not expanded', () => {
      const wrapper = mountForToggle(group());

      expect((wrapper.vm as any).isExpanded).toBe(false);
      expect(wrapper.find('.body').exists()).toBe(false);
    });

    it('writes the toggled state back to the group and emits it', async() => {
      const grp = group();
      const wrapper = mountForToggle(grp);

      await wrapper.find('.toggle-accordion').trigger('click');

      expect(grp).toHaveProperty('expanded', true);
      expect(wrapper.emitted('expand')?.[0]).toStrictEqual([grp]);

      await wrapper.find('.toggle-accordion').trigger('click');

      expect(grp).toHaveProperty('expanded', false);
      expect(wrapper.emitted('close')?.[0]).toStrictEqual([grp]);
    });
  });

  describe('navigating from a group that does not hold the active route', () => {
    // Workloads, expanded, while the user is somewhere else entirely
    const group = () => ({
      name:     'workloads',
      label:    'Workloads',
      expanded: true,
      children: [{
        name:  'workload',
        route: {
          name:   'c-cluster-product-resource',
          params: {
            cluster: 'local', product: 'explorer', resource: 'workload'
          }
        },
      }],
    });

    const mountElsewhere = (grp: any, replace: jest.Mock) => shallowMount(Group as any, {
      props: {
        group: grp, canCollapse: true, idPrefix: '',
      },
      global: {
        mocks: {
          $route: {
            params: {
              cluster: 'local', product: 'explorer', resource: 'configmap'
            },
            path:     '/c/local/explorer/configmap',
            fullPath: '/c/local/explorer/configmap',
            matched:  [],
          },
          $router: {
            replace,
            resolve:   jest.fn().mockReturnValue({ path: '/c/local/explorer/workload' }),
            getRoutes: jest.fn().mockReturnValue([]),
          },
          t: (key: string) => key,
        },
      },
    });

    it('does not navigate when a nav item inside the group is selected', () => {
      const replace = jest.fn();
      const wrapper = mountElsewhere(group(), replace);

      wrapper.findComponent(Type).vm.$emit('selected');

      // The item routes itself, so navigating to the group's first child here
      // would cancel that navigation
      expect(replace).not.toHaveBeenCalled();
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('navigates to the first child when the group header is clicked', async() => {
      const replace = jest.fn();
      const wrapper = mountElsewhere(group(), replace);

      await wrapper.find('.header').trigger('click');

      expect(replace).toHaveBeenCalledWith({
        name:   'c-cluster-product-resource',
        params: {
          cluster: 'local', product: 'explorer', resource: 'workload'
        }
      });
    });
  });

  describe('toggle icon dynamic aria-label (issue #15883)', () => {
    const group = {
      name:     'workloads',
      label:    'Workloads',
      children: [{ route: { name: 'child-route', params: {} } }],
    };

    const tStub = (key: string, vals?: Record<string, string>) => (vals ? `${ key }:${ vals.group }` : key);

    const mountGroupForIcon = (extraProps: Record<string, unknown> = {}) => shallowMount(Group as any, {
      props: {
        group,
        canCollapse: true,
        idPrefix:    '',
        ...extraProps,
      },
      global: {
        mocks: {
          $route: {
            params: {}, path: '/test', fullPath: '/test', matched: [],
          },
          $router: {
            resolve:   jest.fn().mockReturnValue({ path: '/test', fullPath: '/test' }),
            getRoutes: jest.fn().mockReturnValue([]),
          },
          t: tStub,
        },
      },
    });

    it('uses the collapse translation key when the group is expanded', async() => {
      const wrapper = mountGroupForIcon();

      (wrapper.vm as any).isExpanded = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.toggle-accordion').attributes('aria-label')).toBe('nav.ariaLabel.collapse:Workloads');
    });

    it('uses the expand translation key when the group is collapsed', async() => {
      const wrapper = mountGroupForIcon();

      (wrapper.vm as any).isExpanded = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.toggle-accordion').attributes('aria-label')).toBe('nav.ariaLabel.expand:Workloads');
    });

    it('prefers labelDisplay over label in the aria-label', async() => {
      const groupWithDisplayLabel = { ...group, labelDisplay: 'Workloads Display' };
      const wrapper = shallowMount(Group as any, {
        props: {
          group: groupWithDisplayLabel, canCollapse: true, idPrefix: '',
        },
        global: {
          mocks: {
            $route: {
              params: {}, path: '/test', fullPath: '/test', matched: [],
            },
            $router: { resolve: jest.fn().mockReturnValue({ path: '/test', fullPath: '/test' }), getRoutes: jest.fn().mockReturnValue([]) },
            t:       tStub,
          },
        },
      });

      (wrapper.vm as any).isExpanded = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.toggle-accordion').attributes('aria-label')).toBe('nav.ariaLabel.expand:Workloads Display');
    });
  });
});
