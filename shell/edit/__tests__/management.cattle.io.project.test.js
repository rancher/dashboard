import { shallowMount } from '@vue/test-utils';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { Banner } from '@components/Banner';
import { MANAGEMENT } from '@shell/config/types';
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
    const storeWithoutRoleTemplates = {
      ...store,
      getters: {
        ...store.getters,
        'management/schemaFor': (type) => (type === MANAGEMENT.ROLE_TEMPLATE ? undefined : {}),
      },
    };
    const mountWith = (value, mode = _EDIT, $store = store) => shallowMount(ManagementCattleIoProject, {
      props: {
        ...defaultMountOptions.props, mode, value
      },
      global: {
        mocks:                 { $store, $fetchState: { pending: false } },
        renderStubDefaultSlot: true,
      },
    });
    const fetchWith = async(wrapper) => await wrapper.vm.$options.fetch.call(wrapper.vm);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should load the permissions for this project on fetch', async() => {
      fetchProjectMembershipPermissions.mockResolvedValue({
        'local/p-abc': {
          create: true, remove: true, view: true
        }
      });
      const wrapper = mountWith(projectValue());

      await fetchWith(wrapper);

      expect(fetchProjectMembershipPermissions).toHaveBeenCalledWith(store, 'local/p-abc');
      expect(wrapper.vm.membershipPermission).toStrictEqual({
        create: true, remove: true, view: true
      });
      expect(wrapper.vm.membershipPermissionFailed).toStrictEqual(false);
    });

    it('should not load permissions when creating a project', async() => {
      const wrapper = mountWith(projectValue(), _CREATE);

      await fetchWith(wrapper);

      expect(fetchProjectMembershipPermissions).not.toHaveBeenCalled();
    });

    it.each([
      ['can update the project', { update: 'update-link' }, {}, store, _EDIT],
      ['can add and remove members', {}, { create: true, remove: true }, store, _EDIT],
      ['can only add members', {}, { create: true }, store, _EDIT],
      ['can only remove members', {}, { remove: true }, store, _EDIT],
      ['can manage members but not read role templates', {}, { create: true, remove: true }, storeWithoutRoleTemplates, _VIEW],
      ['can only view members', {}, { view: true }, store, _VIEW],
      ['has no member permissions', {}, {}, store, _VIEW],
    ])('should use form mode for a user who %s', async(_, links, membershipPermission, $store, expectedMode) => {
      const wrapper = mountWith(projectValue(links), _EDIT, $store);

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

    describe('when the permission check fails', () => {
      beforeEach(() => {
        fetchProjectMembershipPermissions.mockResolvedValue({});
      });

      it('should show the Members tab with a warning', async() => {
        const wrapper = mountWith(projectValue());

        await fetchWith(wrapper);

        const warnings = wrapper.findAllComponents(Banner).filter((banner) => banner.props('color') === 'warning');

        expect(wrapper.vm.membershipPermissionFailed).toStrictEqual(true);
        expect(wrapper.vm.canViewMembers).toStrictEqual(true);
        expect(warnings).toHaveLength(1);
      });

      it.each([
        ['can update the project', { update: 'update-link' }, _EDIT],
        ['cannot update the project', {}, _VIEW],
      ])('should use form mode for a user who %s', async(_, links, expectedMode) => {
        const wrapper = mountWith(projectValue(links));

        await fetchWith(wrapper);

        expect(wrapper.vm.formMode).toStrictEqual(expectedMode);
      });
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
