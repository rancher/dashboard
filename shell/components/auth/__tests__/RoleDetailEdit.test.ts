import { mount } from '@vue/test-utils';
import RoleDetailEdit from '@shell/components/auth/RoleDetailEdit.vue';
import { SUBTYPE_MAPPING } from '@shell/models/management.cattle.io.roletemplate';

const role = {
  apiVersion:            'management.cattle.io/v3',
  kind:                  'GlobalRole',
  metadata:              { name: 'global-role-with-inherited' },
  inheritedClusterRoles: ['cluster-admin'],
  rules:
[{
  verbs:     ['get', 'list'],
  resources: ['pods'],
  apiGroups: ['']
}],
  subtype: SUBTYPE_MAPPING.GLOBAL.id
};

describe('component: RoleDetailEdit', () => {
  it('does not have validation errors when the role has no displayName', () => {
    const wrapper = mount(RoleDetailEdit, {
      propsData: { value: role },
      mocks:     {
        $fetchState: { pending: false },
        $route:      { name: 'anything' },
        $store:      {
          getters: {
            currentStore: () => 'store', 'i18n/t': jest.fn(), 'store/schemaFor': jest.fn()
          }
        }
      },
      stubs: {
        CruResource: { template: '<div><slot></slot></div>' },
        // NameNsDescription: true,
        Tab:         { template: '<div><slot></slot></div>' },
      }
    });

    expect((wrapper.vm as any).fvFormIsValid).toBe(true);
  });
});
