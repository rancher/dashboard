import { shallowMount } from '@vue/test-utils';
import ManagementCattleIoProject from '@shell/edit/management.cattle.io.project.vue';
import { _EDIT } from '@shell/config/query-params';

const mockStore = {
  getters: {
    'management/schemaFor': () => ({}),
    currentCluster:         () => ({ spec: { kubernetesVersion: 'v1.23.0' } }),
    isStandaloneHarvester:  () => false,
    currentProduct:         () => ({ inStore: 'rancher' }),
    'auth/principalId':     () => 'local://user',
    'i18n/t':               (key) => key,
  },
  dispatch: jest.fn(),
};

const defaultMountOptions = {
  props:  { mode: _EDIT },
  global: { mocks: { $store: mockStore } }
};

describe('component: ManagementCattleIoProject', () => {
  it('should remove a standard resource quota correctly', async() => {
    const value = {
      spec: {
        resourceQuota:                 { limit: { limitsCpu: '100m', limitsMemory: '1Gi' } },
        namespaceDefaultResourceQuota: { limit: { limitsCpu: '50m', limitsMemory: '500Mi' } }
      },
      metadata:     { namespace: 'test-ns', annotations: {} },
      save:         jest.fn(),
      listLocation: { name: 'list' }
    };

    const wrapper = shallowMount(
      ManagementCattleIoProject,
      {
        ...defaultMountOptions,
        props: {
          ...defaultMountOptions.props,
          value,
        },
      }
    );

    wrapper.vm.removeQuota('limitsCpu');

    expect(wrapper.vm.value.spec.resourceQuota.limit.limitsCpu).toBeUndefined();
    expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.limit.limitsCpu).toBeUndefined();
    expect(wrapper.vm.value.spec.resourceQuota.limit.limitsMemory).toBe('1Gi'); // Ensure other quotas are not affected
  });

  it('should remove a custom resource quota with single period in name correctly', async() => {
    const value = {
      spec: {
        resourceQuota:                 { limit: { extended: { test2: '1' } } },
        namespaceDefaultResourceQuota: { limit: { extended: { test2: '2' } } }
      },
      metadata:     { namespace: 'test-ns', annotations: {} },
      save:         jest.fn(),
      listLocation: { name: 'list' }
    };

    const wrapper = shallowMount(
      ManagementCattleIoProject,
      {
        ...defaultMountOptions,
        props: {
          ...defaultMountOptions.props,
          value,
        },
      }
    );

    wrapper.vm.removeQuota(`extended.test2`);

    expect(wrapper.vm.value.spec.resourceQuota.limit.extended).toBeUndefined();
    expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.limit.extended).toBeUndefined();
  });

  it('should remove a custom resource quota with multiple periods in name correctly', async() => {
    const value = {
      spec: {
        resourceQuota:                 { limit: { extended: { 'requests.nvidia.com/gpu': '4' } } },
        namespaceDefaultResourceQuota: { limit: { extended: { 'requests.nvidia.com/gpu': '2' } } }
      },
      metadata:     { namespace: 'test-ns', annotations: {} },
      save:         jest.fn(),
      listLocation: { name: 'list' }
    };

    const wrapper = shallowMount(
      ManagementCattleIoProject,
      {
        ...defaultMountOptions,
        props: {
          ...defaultMountOptions.props,
          value,
        },
      }
    );

    wrapper.vm.removeQuota(`extended.requests.nvidia.com/gpu`);

    expect(wrapper.vm.value.spec.resourceQuota.limit.extended).toBeUndefined();
    expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.limit.extended).toBeUndefined();
  });

  it('should remove one of multiple custom resource quotas correctly', async() => {
    const value = {
      spec: {
        resourceQuota:                 { limit: { extended: { test1: '1', test2: '2' } } },
        namespaceDefaultResourceQuota: { limit: { extended: { test1: '3', test2: '4' } } }
      },
      metadata:     { namespace: 'test-ns', annotations: {} },
      save:         jest.fn(),
      listLocation: { name: 'list' }
    };

    const wrapper = shallowMount(
      ManagementCattleIoProject,
      {
        ...defaultMountOptions,
        props: {
          ...defaultMountOptions.props,
          value,
        },
      }
    );

    wrapper.vm.removeQuota('extended.test1');

    expect(wrapper.vm.value.spec.resourceQuota.limit.extended.test1).toBeUndefined();
    expect(wrapper.vm.value.spec.resourceQuota.limit.extended.test2).toBe('2');
    expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.limit.extended.test1).toBeUndefined();
    expect(wrapper.vm.value.spec.namespaceDefaultResourceQuota.limit.extended.test2).toBe('4');
  });
});
