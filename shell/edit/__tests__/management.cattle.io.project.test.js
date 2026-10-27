import { shallowMount } from '@vue/test-utils';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ManagementCattleIoProject from '@shell/edit/management.cattle.io.project.vue';
import { _EDIT } from '@shell/config/query-params';

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
  global: { mocks: { $store: mockStore } }
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
