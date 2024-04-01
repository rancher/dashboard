
/* eslint-disable jest/no-mocks-import */
import { shallowMount } from '@vue/test-utils';
import NodeGroup from '@pkg/eks/components/NodeGroup.vue';
import describeLaunchTemplateVersionsResponseData from '../__mocks__/describeLaunchTemplateVersions.js';
const mockedValidationMixin = {
  computed: {
    fvFormIsValid:                jest.fn(),
    type:                         jest.fn(),
    fvUnreportedValidationErrors: jest.fn(),
  },
  methods: { fvGetAndReportPathRules: jest.fn() }
};

const mockedStore = () => {
  return {
    getters: {
      'i18n/t': (text: string) => text,
      t:        (text: string) => text,
    },
    dispatch: () => {
      return {
        describeLaunchTemplateVersions: () => {
          return describeLaunchTemplateVersionsResponseData;
        }
      };
    }
  };
};

jest.mock('lodash/debounce', () => jest.fn((fn) => fn));
const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    mixins: [mockedValidationMixin],
    mocks:  {
      $store:      mockedStore(),
      $route:      mockedRoute,
      $fetchState: {},
    }
  };
};

describe('eKS Node Groups', () => {
  it('should load template-controlled fields when a template version is selected', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate: {
          id: 'lt-123123', name: 'test-template', version: 4
        },
        region:                 'foo',
        amazonCredentialSecret: 'bar'
      },
      ...setup
    });

    await wrapper.vm.$nextTick();

    const instanceType = wrapper.find('[data-testid="eks-instance-type-dropdown"]');

    expect(instanceType.vm.value).toBeDefined();
  });

  it('should disable template-controlled fields when a template version is selected', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate: {
          id: 'lt-123123', name: 'test-template', version: 4
        },
        region:                 'foo',
        amazonCredentialSecret: 'bar'
      },
      ...setup
    });

    await wrapper.vm.$nextTick();
    const imageId = wrapper.find('[data-testid="eks-image-id-input"]');

    expect(imageId.vm.disabled).toBe(true);
  });

  it('should warn the user about selecting spot instances when the launch template includes an instance type', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate: {
          id: 'lt-123123', name: 'test-template', version: 4
        },
        region:                 'foo',
        amazonCredentialSecret: 'bar',
      },
      ...setup
    });

    wrapper.setProps({ requestSpotInstances: true });
    await wrapper.vm.$nextTick();
    const banner = wrapper.find('[data-testid="eks-spot-instance-banner"]');

    expect(banner.exists()).toBe(true);

    wrapper.setProps({ requestSpotInstances: false });
    await wrapper.vm.$nextTick();
    expect(banner.exists()).toBe(false);
  });

  it('should prevent users from enabling gpu when the launch template includes an AMI', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate: {
          id: 'lt-123123', name: 'test-template', version: 4
        },
        region:                 'foo',
        amazonCredentialSecret: 'bar',
      },
      ...setup
    });

    // waiting for the component to fetch aws launch template info
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const gpuInput = wrapper.find('[data-testid="eks-gpu-input"]');

    expect(gpuInput.vm.disabled).toBe(true);
  });

  it('should disable the instance types dropdown when spot instances are enabled', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
      },
      ...setup
    });

    wrapper.setProps({ requestSpotInstances: true });
    await wrapper.vm.$nextTick();
    const instanceType = wrapper.find('[data-testid="eks-instance-type-dropdown"]');

    expect(instanceType.vm.disabled).toBe(true);

    wrapper.setProps({ requestSpotInstances: false });
    await wrapper.vm.$nextTick();

    expect(instanceType.vm.disabled).toBe(false);
  });

  it('should show a spot instances dropdown when spot instances are enabled', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
      },
      ...setup
    });

    wrapper.setProps({ requestSpotInstances: true });
    await wrapper.vm.$nextTick();
    const spotInstanceType = wrapper.find('[data-testid="eks-spot-instance-type-dropdown"]');

    expect(spotInstanceType.exists()).toBe(true);

    wrapper.setProps({ requestSpotInstances: false });
    await wrapper.vm.$nextTick();

    expect(spotInstanceType.exists()).toBe(false);
  });

  it('should revert to the default node group value for any inputs cleared when the launch template version is changed', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate: {
          id: 'lt-123123', name: 'test-template', version: 4
        },
        region:                 'foo',
        amazonCredentialSecret: 'bar',
      },
      ...setup
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    const diskSizeUpdates = wrapper.emitted('update:diskSize') || [];
    let latest = (diskSizeUpdates[diskSizeUpdates.length - 1] || [])[0];

    expect(latest).toBe(80);

    wrapper.setProps({ launchTemplate: {} });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    latest = (diskSizeUpdates[diskSizeUpdates.length - 1] || [])[0];

    expect(latest).toBe(20);
  });
});
