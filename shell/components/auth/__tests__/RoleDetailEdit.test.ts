import { mount } from '@vue/test-utils';
import RoleDetailEdit from '@shell/components/auth/RoleDetailEdit.vue';
import { SUBTYPE_MAPPING } from '@shell/models/management.cattle.io.roletemplate';
import { MANAGEMENT } from '@shell/config/types';

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

  describe('resourceOptions', () => {
    const createWrapper = () => mount(RoleDetailEdit, {
      props: {
        value: {
          type:     MANAGEMENT.GLOBAL_ROLE,
          rules:    [],
          subtype:  SUBTYPE_MAPPING.GLOBAL.id,
          metadata: { name: 'global-role' },
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

    const optionValues = (wrapper: any) => wrapper.vm.resourceOptions
      .filter((option: any) => option.kind !== 'group' && typeof option.value === 'object')
      .map((option: any) => option.value);

    it.each([
      ['', 'nodes'],
      ['', 'endpoints'],
      ['storage.k8s.io', 'csistoragecapacities'],
    ])('should offer resource with apiGroup %p and name %p', (apiGroupValue: string, resourceName: string) => {
      const wrapper = createWrapper();

      expect(optionValues(wrapper)).toContainEqual({ resourceName, apiGroupValue });
    });

    it.each([
      ['', 'node'],
      ['io.k8s.api.discovery', 'endpoints'],
      ['storage.k8s.io', 'csistoragecapacitys'],
    ])('should not offer invalid resource with apiGroup %p and name %p', (apiGroupValue: string, resourceName: string) => {
      const wrapper = createWrapper();

      expect(optionValues(wrapper)).not.toContainEqual({ resourceName, apiGroupValue });
    });
  });
});
