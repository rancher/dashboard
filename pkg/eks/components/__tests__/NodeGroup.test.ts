
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

describe('eKS Node Groups: create', () => {
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

  it('should show a disabled text input with kubernetes version', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
        version:                '1.23',
        clusterVersion:         '1.23'
      },
      ...setup
    });

    const versionDisplay = wrapper.find('[data-testid="eks-version-display"]');
    const upgradeVersionBanner = wrapper.find('[data-testid="eks-version-upgrade-banner"]');
    const upgradeVersionCheckbox = wrapper.find('[data-testid="eks-version-upgrade-checkbox"]');

    expect(versionDisplay.isVisible()).toBe(true);
    expect(versionDisplay.props().value).toBe('1.23');
    expect(upgradeVersionBanner.exists()).toBe(false);
    expect(upgradeVersionCheckbox.exists()).toBe(false);
  });

  it('should update resource tags', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
      },
      ...setup
    });

    const tagsInput = wrapper.find('[data-testid="eks-resource-tags-input"]');

    expect(tagsInput.props().value).toStrictEqual({});

    tagsInput.vm.$emit('input', { abc: 'def' });

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:tags')?.[0]?.[0]).toStrictEqual({ abc: 'def' });
    // no need to test that emitting 'update:tags' will set this prop as its built-in vue functionality
    wrapper.setProps({ tags: { abc: 'def' } });

    await wrapper.vm.$nextTick();
    expect(tagsInput.props().value).toStrictEqual({ abc: 'def' });
  });
});

describe('eks node groups: edit', () => {
  it('should show an info banner telling the user they can upgrade the node version after the cluster upgrade finishes', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
        version:                '1.23',
        clusterVersion:         '1.23',
        originalClusterVersion: '1.23',
        isNewOrUnprovisioned:   false
      },
      ...setup
    });

    const versionDisplay = wrapper.find('[data-testid="eks-version-display"]');
    let upgradeVersionBanner = wrapper.find('[data-testid="eks-version-upgrade-banner"]');
    let upgradeVersionCheckbox = wrapper.find('[data-testid="eks-version-upgrade-checkbox"]');

    expect(versionDisplay.isVisible()).toBe(true);
    expect(upgradeVersionBanner.exists()).toBe(false);
    expect(upgradeVersionCheckbox.exists()).toBe(false);

    wrapper.setProps({ clusterVersion: '1.24' });

    await wrapper.vm.$nextTick();

    upgradeVersionBanner = wrapper.find('[data-testid="eks-version-upgrade-banner"]');
    upgradeVersionCheckbox = wrapper.find('[data-testid="eks-version-upgrade-checkbox"]');

    expect(versionDisplay.isVisible()).toBe(true);
    expect(versionDisplay.props().value).toBe('1.23');

    expect(upgradeVersionBanner.exists()).toBe(true);
    expect(upgradeVersionCheckbox.exists()).toBe(false);
  });

  it('should show the user a checkbox to upgrade the node version if the cluster version is ahead of node version and not currently being changed', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
        version:                '1.23',
        clusterVersion:         '1.24',
        originalClusterVersion: '1.24',
        isNewOrUnprovisioned:   false
      },
      ...setup
    });

    const versionDisplay = wrapper.find('[data-testid="eks-version-display"]');
    const upgradeVersionBanner = wrapper.find('[data-testid="eks-version-upgrade-banner"]');
    const upgradeVersionCheckbox = wrapper.find('[data-testid="eks-version-upgrade-checkbox"]');

    expect(versionDisplay.exists()).toBe(false);
    expect(upgradeVersionBanner.exists()).toBe(false);
    expect(upgradeVersionCheckbox.exists()).toBe(true);
  });

  it('should update the node version to match the cluster version when the upgrade checkbox is checked', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
        version:                '1.23',
        clusterVersion:         '1.24',
        originalClusterVersion: '1.24',
        isNewOrUnprovisioned:   false
      },
      ...setup
    });

    const upgradeVersionCheckbox = wrapper.find('[data-testid="eks-version-upgrade-checkbox"]');

    upgradeVersionCheckbox.vm.$emit('input', true);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:version')?.[0]?.[0]).toBe('1.24');
  });

  it('should revert the node version to its original version when the upgrade checkbox is unchecked', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
        version:                '1.23',
        clusterVersion:         '1.24',
        originalClusterVersion: '1.24',
        isNewOrUnprovisioned:   false
      },
      ...setup
    });

    const upgradeVersionCheckbox = wrapper.find('[data-testid="eks-version-upgrade-checkbox"]');

    wrapper.setProps({ version: '1.24' });
    await wrapper.vm.$nextTick();

    expect(upgradeVersionCheckbox.props().value).toBe(true);

    upgradeVersionCheckbox.vm.$emit('input', false);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:version')?.[0]?.[0]).toBe('1.23');
  });

  // poolIsNew is tested in crueks.test.ts
  it('should allow the node group name to be changed if poolIsNew is true', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
        poolIsNew:              true,
        isNewOrUnprovisioned:   false
      },
      ...setup
    });

    const nameInput = wrapper.find('[data-testid="eks-nodegroup-name"]');

    expect(nameInput.props().disabled).toBe(false);
  });

  it('should allow the node group name to be changed if poolIsNew is false', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(NodeGroup, {
      propsData: {
        launchTemplate:         {},
        region:                 'foo',
        amazonCredentialSecret: 'bar',
        poolIsNew:              false,
        isNewOrUnprovisioned:   false
      },
      ...setup
    });

    const nameInput = wrapper.find('[data-testid="eks-nodegroup-name"]');

    expect(nameInput.props().disabled).toBe(true);
  });
});
