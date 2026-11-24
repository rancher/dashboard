import { mount, shallowMount } from '@vue/test-utils';
import RoleDetailEdit from '@shell/components/auth/RoleDetailEdit.vue';
import { SUBTYPE_MAPPING } from '@shell/models/management.cattle.io.roletemplate';
import { MANAGEMENT } from '@shell/config/types';
import { _CREATE } from '@shell/config/query-params';
import CruResource from '@shell/components/CruResource.vue';

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

  it('should not stop CruResource offering YAML when creating a role', () => {
    const wrapper = shallowMount(RoleDetailEdit, {
      props: {
        mode:  _CREATE,
        value: {
          type:     MANAGEMENT.GLOBAL_ROLE,
          rules:    [],
          subtype:  SUBTYPE_MAPPING.GLOBAL.id,
          metadata: { name: '' },
        },
      },

      global: {
        mocks: {
          $fetchState: { pending: false },
          $route:      { name: 'anything', query: {} },
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

    expect(wrapper.findComponent(CruResource).props('canYaml')).toBe(true);
  });

  it('should pass its own errors to CruResource when the page passes an errors attribute', async() => {
    const wrapper = shallowMount(RoleDetailEdit, {
      props: {
        value: {
          type:     MANAGEMENT.GLOBAL_ROLE,
          rules:    [],
          subtype:  SUBTYPE_MAPPING.GLOBAL.id,
          metadata: { name: 'global-role' },
        },
      },
      attrs: { errors: [] },

      global: {
        mocks: {
          $fetchState: { pending: false },
          $route:      { name: 'anything', query: {} },
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
    const error = { code: 'MissingRequired', fieldName: 'name' };

    wrapper.findComponent(CruResource).vm.$emit('error', [error]);
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(CruResource).props('errors')).toStrictEqual([error]);
  });

  it('should send CruResource back to the list it was opened from', () => {
    const wrapper = shallowMount(RoleDetailEdit, {
      props: {
        mode:  _CREATE,
        value: {
          type:     MANAGEMENT.GLOBAL_ROLE,
          rules:    [],
          subtype:  SUBTYPE_MAPPING.GLOBAL.id,
          metadata: { name: '' },
        },
      },
      attrs: { 'done-route': 'somewhere-else' },

      global: {
        mocks: {
          $fetchState: { pending: false },
          $route:      { name: 'c-cluster-auth-roles-resource-create', query: {} },
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

    expect(wrapper.findComponent(CruResource).props('doneRoute')).toBe('c-cluster-auth-roles-resource');
  });

  it('should pass applyHooks to CruResource so default role changes apply before previewing YAML', async() => {
    const value: Record<string, any> = {
      type:     MANAGEMENT.ROLE_TEMPLATE,
      rules:    [],
      subtype:  SUBTYPE_MAPPING.CLUSTER.id,
      metadata: { name: '' },
    };
    const wrapper = shallowMount(RoleDetailEdit, {
      props:  { mode: _CREATE, value },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $route:      { name: 'anything', query: {} },
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

    (wrapper.vm as any).defaultValue = true;
    const applyHooks = wrapper.findComponent(CruResource).props('applyHooks') as (event: string) => Promise<void>;

    await applyHooks('_beforeSaveHooks');

    expect(value.clusterCreatorDefault).toBe(true);
  });

  it('should not set an undefined property when running before-save hooks on an RBAC role', async() => {
    const value: Record<string, any> = {
      type:     SUBTYPE_MAPPING.RBAC_ROLE.type,
      rules:    [],
      subtype:  SUBTYPE_MAPPING.RBAC_ROLE.id,
      metadata: { name: '' },
    };
    const wrapper = shallowMount(RoleDetailEdit, {
      props:  { mode: _CREATE, value },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $route:      { name: 'anything', query: {} },
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

    const applyHooks = wrapper.findComponent(CruResource).props('applyHooks') as (event: string) => Promise<void>;

    await applyHooks('_beforeSaveHooks');

    expect(value).not.toHaveProperty('undefined');
  });

  it('should not pass the model\'s name error to CruResource when opening a new RBAC role', async() => {
    const nameRequired = '"Name" is required';
    const value = {
      type:                   SUBTYPE_MAPPING.RBAC_ROLE.type,
      rules:                  [],
      subtype:                SUBTYPE_MAPPING.RBAC_ROLE.id,
      metadata:               { name: '' },
      modelValidationRules:   [{ path: 'name', rules: [() => nameRequired] }],
      customValidationErrors: (_: unknown, ignorePaths: string[] = []) => (ignorePaths.includes('name') ? [] : [nameRequired]),
    };
    const wrapper = shallowMount(RoleDetailEdit, {
      props:  { mode: _CREATE, value },
      global: {
        renderStubDefaultSlot: true,
        mocks:                 {
          $fetchState: { pending: false },
          $route:      { name: 'anything', query: {} },
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

    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(CruResource).props('errors')).toStrictEqual([]);
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
