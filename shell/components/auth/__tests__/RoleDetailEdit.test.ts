import { mount, shallowMount } from '@vue/test-utils';
import RoleDetailEdit from '@shell/components/auth/RoleDetailEdit.vue';
import { SUBTYPE_MAPPING } from '@shell/models/management.cattle.io.roletemplate';

describe('component: RoleDetailEdit', () => {
  it('does not have validation errors when the role has no displayName', () => {
    const role = {
      apiVersion:            'management.cattle.io/v3',
      kind:                  'GlobalRole',
      metadata:              { name: 'global-role-with-inherited' },
      inheritedClusterRoles: ['cluster-admin'],
      rules:                 [{
        verbs:     ['get', 'list'],
        resources: ['pods'],
        apiGroups: ['']
      }],
      subtype: SUBTYPE_MAPPING.GLOBAL.id
    };
    const wrapper = mount(RoleDetailEdit, {
      props: { value: role },

      global: {
        mocks: {
          $fetchState: { pending: false },
          $route:      { name: 'anything' },
          $store:      {
            dispatch: jest.fn(),
            getters:  {
              currentStore:           () => 'store',
              'i18n/t':               jest.fn(),
              'store/schemaFor':      jest.fn(),
              'store/customisation/': jest.fn()
            }
          }
        },

        stubs: {
          CruResource: { template: '<div><slot></slot></div>' },
          Tab:         { template: '<div><slot></slot></div>' },
        },
      },
    });

    expect((wrapper.vm as any).fvFormIsValid).toBe(true);
  });

  it.each([
    [['*']],
    [['create', 'delete', 'get', 'list', 'patch', 'update', 'watch']],
  ])('should display the verbs %p', (verbs: string[]) => {
    const wrapper = mount(RoleDetailEdit, {
      props: {
        value: {
          rules:    [{ verbs }],
          subtype:  'GLOBAL',
          metadata: { name: 'global-role-with-inherited' },
        },
      },

      global: {
        mocks: {
          $fetchState: { pending: false },
          $route:      { name: 'anything' },
          $store:      {
            dispatch: jest.fn(),
            getters:  {
              currentStore:           () => 'store',
              'i18n/t':               jest.fn(),
              'store/schemaFor':      jest.fn(),
              'store/customisation/': jest.fn()
            }
          }
        },

        stubs: {
          CruResource: { template: '<div><slot></slot></div>' },
          Tab:         { template: '<div><slot></slot></div>' },
        },
      },
    });

    expect(wrapper.vm.value.rules[0].verbs).toStrictEqual(verbs);
  });

  it.each([
    'pods/exec',
    'pods/log',
    'pods/status',
  ])('should offer the %p resource in the core API group', (resourceName: string) => {
    const wrapper = shallowMount(RoleDetailEdit, {
      props: {
        value: {
          type:     SUBTYPE_MAPPING.NAMESPACE.type,
          rules:    [{ verbs: ['get'] }],
          subtype:  SUBTYPE_MAPPING.NAMESPACE.id,
          metadata: { name: 'project-role' },
        },
      },

      global: {
        mocks: {
          $fetchState: { pending: false },
          $route:      { name: 'anything' },
          $store:      {
            dispatch: jest.fn(),
            getters:  {
              currentStore:           () => 'store',
              'i18n/t':               jest.fn(),
              'store/schemaFor':      jest.fn(),
              'store/customisation/': jest.fn()
            }
          }
        },
      },
    });
    const matchingValues = (wrapper.vm as any).resourceOptions
      .map((option: any) => option.value)
      .filter((value: any) => value?.resourceName === resourceName);

    expect(matchingValues).toStrictEqual([{ resourceName, apiGroupValue: '' }]);
  });
});
