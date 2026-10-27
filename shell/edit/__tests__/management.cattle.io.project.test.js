import { shallowMount } from '@vue/test-utils';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ManagementCattleIoProject from '@shell/edit/management.cattle.io.project.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { fetchProjectMembershipPermissions } from '@shell/utils/project-permissions';

jest.mock('@shell/utils/project-permissions', () => ({ fetchProjectMembershipPermissions: jest.fn() }));

const mockStore = {
  getters: {
    'management/schemaFor': () => ({}),
    'rancher/schemaFor':    () => null,
    currentCluster:         () => ({ spec: { kubernetesVersion: 'v1.23.0' } }),
    isStandaloneHarvester:  () => false,
    currentProduct:         () => ({ inStore: 'rancher' }),
    'auth/principalId':     () => 'local://user',
    'i18n/t':               (key) => key,
  },
  dispatch: jest.fn(),
};

const defaultMountOptions = {
  props: {
    mode:  _EDIT,
    value: {
      spec:     { containerDefaultResourceLimit: {} },
      metadata: { namespace: 'test-ns', annotations: {} },
    }
  },
  global: { mocks: { $store: mockStore, $fetchState: { pending: false } } }
};

describe('component: ManagementCattleIoProject', () => {
  describe('onQuotasInput', () => {
    it('should update resourceQuota limit while preserving other resourceQuota fields', () => {
      const value = {
        spec: {
          resourceQuota:                 { limit: { limitsCpu: '100m' }, usedLimit: { limitsCpu: '50m' } },
          namespaceDefaultResourceQuota: { limit: { limitsCpu: '50m' } }
        },
        metadata:     { namespace: 'test-ns', annotations: {} },
        save:         jest.fn(),
        listLocation: { name: 'list' }
      };

      const wrapper = shallowMount(ManagementCattleIoProject, {
        ...defaultMountOptions,
        props: { ...defaultMountOptions.props, value },
      });

      wrapper.vm.onQuotasInput({ projectLimit: { limitsCpu: '200m' }, nsLimit: { limitsCpu: '100m' } });

      expect(wrapper.vm.value.spec.resourceQuota.limit).toStrictEqual({ limitsCpu: '200m' });
      expect(wrapper.vm.value.spec.resourceQuota.usedLimit).toStrictEqual({ limitsCpu: '50m' });
    });

    it('should update namespaceDefaultResourceQuota limit while preserving other namespaceDefaultResourceQuota fields', () => {
      const value = {
        spec: {
          resourceQuota:                 { limit: { limitsCpu: '100m' } },
          namespaceDefaultResourceQuota: { limit: { limitsCpu: '50m' }, extraField: 'preserved' }
        },
        metadata:     { namespace: 'test-ns', annotations: {} },
        save:         jest.fn(),
        listLocation: { name: 'list' }
      };

      const wrapper = shallowMount(ManagementCattleIoProject, {
        ...defaultMountOptions,
        props: { ...defaultMountOptions.props, value },
      });

      wrapper.vm.onQuotasInput({ projectLimit: { limitsCpu: '200m' }, nsLimit: { limitsCpu: '100m' } });

      expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.limit).toStrictEqual({ limitsCpu: '100m' });
      expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.extraField).toStrictEqual('preserved');
    });

    it('should set both resourceQuota and namespaceDefaultResourceQuota limits from input', () => {
      const value = {
        spec: {
          resourceQuota:                 { limit: {} },
          namespaceDefaultResourceQuota: { limit: {} }
        },
        metadata:     { namespace: 'test-ns', annotations: {} },
        save:         jest.fn(),
        listLocation: { name: 'list' }
      };

      const wrapper = shallowMount(ManagementCattleIoProject, {
        ...defaultMountOptions,
        props: { ...defaultMountOptions.props, value },
      });

      wrapper.vm.onQuotasInput({
        projectLimit: { limitsCpu: '500m', limitsMemory: '2Gi' },
        nsLimit:      { limitsCpu: '250m', limitsMemory: '1Gi' },
      });

      expect(wrapper.vm.value.spec.resourceQuota.limit).toStrictEqual({ limitsCpu: '500m', limitsMemory: '2Gi' });
      expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.limit).toStrictEqual({ limitsCpu: '250m', limitsMemory: '1Gi' });
    });
  });

  describe('name and description', () => {
    it('should be disabled in edit mode when the user cannot update the project', () => {
      const wrapper = shallowMount(ManagementCattleIoProject, {
        ...defaultMountOptions,
        global: { ...defaultMountOptions.global, renderStubDefaultSlot: true },
      });

      const nameNsDescription = wrapper.findComponent(NameNsDescription);

      expect(nameNsDescription.props('nameDisabled')).toStrictEqual(true);
      expect(nameNsDescription.props('descriptionDisabled')).toStrictEqual(true);
    });

    it('should be enabled in edit mode when the user can update the project', () => {
      const wrapper = shallowMount(ManagementCattleIoProject, {
        ...defaultMountOptions,
        props: {
          ...defaultMountOptions.props,
          value: { ...defaultMountOptions.props.value, links: { update: 'update-link' } },
        },
        global: { ...defaultMountOptions.global, renderStubDefaultSlot: true },
      });

      const nameNsDescription = wrapper.findComponent(NameNsDescription);

      expect(nameNsDescription.props('nameDisabled')).toStrictEqual(false);
      expect(nameNsDescription.props('descriptionDisabled')).toStrictEqual(false);
    });
  });

  describe('per-project member permissions', () => {
    const projectValue = (links = {}) => ({
      ...defaultMountOptions.props.value,
      id: 'local/p-abc',
      links,
    });
    const store = {
      ...mockStore,
      getters: {
        ...mockStore.getters,
        'rancher/schemaFor': () => ({}),
        'auth/principalId':  'local://user',
      },
    };
    const mountWith = (value, mode = _EDIT) => shallowMount(ManagementCattleIoProject, {
      props: {
        ...defaultMountOptions.props, mode, value
      },
      global: { mocks: { $store: store, $fetchState: { pending: false } } },
    });

    it('should load the permissions for this project on fetch', async() => {
      fetchProjectMembershipPermissions.mockResolvedValue({
        'local/p-abc': {
          create: true, remove: true, view: true
        }
      });
      const wrapper = mountWith(projectValue());

      await wrapper.vm.$options.fetch.call(wrapper.vm);

      expect(fetchProjectMembershipPermissions).toHaveBeenCalledWith(store, 'local/p-abc');
      expect(wrapper.vm.membershipPermission).toStrictEqual({
        create: true, remove: true, view: true
      });
    });

    it('should not load permissions when creating a project', async() => {
      fetchProjectMembershipPermissions.mockClear();
      const wrapper = mountWith(projectValue(), _CREATE);

      await wrapper.vm.$options.fetch.call(wrapper.vm);

      expect(fetchProjectMembershipPermissions).not.toHaveBeenCalled();
    });

    it.each([
      ['can update the project', { update: 'update-link' }, {}, _EDIT],
      ['can manage members', {}, { create: true }, _EDIT],
      ['can only view members', {}, { view: true }, _VIEW],
      ['has no member permissions', {}, {}, _VIEW],
    ])('should use %s -> form mode', async(_, links, membershipPermission, expectedMode) => {
      const wrapper = mountWith(projectValue(links));

      await wrapper.setData({ membershipPermission });

      expect(wrapper.vm.formMode).toStrictEqual(expectedMode);
      expect(wrapper.findComponent(CruResource).props('mode')).toStrictEqual(expectedMode);
    });

    it.each([
      [{ view: true }, _EDIT, true],
      [{}, _EDIT, false],
      [{}, _CREATE, true],
    ])('should show the Members tab for permissions %j in %s mode: %s', async(membershipPermission, mode, expected) => {
      const wrapper = mountWith(projectValue(), mode);

      await wrapper.setData({ membershipPermission });

      expect(wrapper.vm.canViewMembers).toStrictEqual(expected);
    });
  });

  it('should update isQuotasValid when validateQuotas is called', () => {
    const wrapper = shallowMount(ManagementCattleIoProject, defaultMountOptions);

    wrapper.vm.validateQuotas(false);
    expect(wrapper.vm.isQuotasValid).toStrictEqual(false);

    wrapper.vm.validateQuotas(true);
    expect(wrapper.vm.isQuotasValid).toStrictEqual(true);
  });

  it('cruResource validation-passed should be false if isQuotasValid is false', async() => {
    const wrapper = shallowMount(ManagementCattleIoProject, defaultMountOptions);

    await wrapper.setData({ isQuotasValid: false });

    const cruResource = wrapper.findComponent(CruResource);

    expect(cruResource.props('validationPassed')).toStrictEqual(false);
  });
});
