import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';

import Networking from '@pkg/gke/components/Networking.vue';

// const mockedValidationMixin = {
//   computed: {
//     fvFormIsValid:                jest.fn(),
//     type:                         jest.fn(),
//     fvUnreportedValidationErrors: jest.fn(),
//   },
//   methods: { fvGetAndReportPathRules: jest.fn() }
// };

const mockedStore = () => {
  return {
    getters: {
      'i18n/t':     (text: string) => text,
      t:            (text: string) => text,
      currentStore: () => 'current_store',
    },
    dispatch: jest.fn()
  };
};
const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    // mixins: [mockedValidationMixin],
    global: {
      mocks: {
        $store:      mockedStore(),
        $route:      mockedRoute,
        $fetchState: {},
      }
    }
  };
};

jest.mock('@pkg/gke/util/gcp');
jest.mock('lodash/debounce', () => jest.fn((fn) => fn));

describe('gke Networking', () => {
  it('should load networks and subnetworks from gcp when credential, project, zone, or region changes', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });
    const spy = jest.spyOn(wrapper.vm, 'debouncedLoadGCPData');

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();
    wrapper.setProps({ projectId: '1234' });
    await flushPromises();
    wrapper.setProps({ zone: 'us-central1-c' });
    await flushPromises();
    wrapper.setProps({ region: 'us-central1' });
    await flushPromises();

    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('should populate network dropdown and select the default network after loading gcp data', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const networksDropdown = wrapper.getComponent('[data-testid="gke-networks-dropdown"]');

    expect(networksDropdown.props().options).toHaveLength(5);
    expect(wrapper.emitted('update:network')?.[0]?.[0]).toBe('default');
  });

  it('should populate subnetworks dropdown dependent on network selection', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const subnetworksDropdown = wrapper.getComponent('[data-testid="gke-subnetworks-dropdown"]');

    expect(subnetworksDropdown.props().options).toHaveLength(0);

    wrapper.setProps({ network: 'host-shared-vpc' });
    await wrapper.vm.$nextTick();
    expect(subnetworksDropdown.props().options).toHaveLength(4);
    wrapper.setProps({ network: 'test-network' });
    await wrapper.vm.$nextTick();
    expect(subnetworksDropdown.props().options).toHaveLength(1);
  });

  it('should select a subnetwork - not autocreate option - when the subnetwork dropdown is populated', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    wrapper.setProps({ network: 'host-shared-vpc' });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:subnetwork')?.[0]?.[0]).toBe('host-shared-vpc-us-west1-subnet-public');
  });

  it('should show text input for cluster and service secondary range if no subnetwork is selected, otherwise should show a dropdown', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project',
        network:           'host-shared-vpc'
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const secondaryRangeNameInput = wrapper.findComponent('[data-testid="gke-subnetwork-name-input"]');
    let secondaryRangeDropdown = wrapper.findComponent('[data-testid="gke-cluster-secondary-range-name-select"]');

    expect(secondaryRangeNameInput.exists()).toBe(true);
    expect(secondaryRangeDropdown.exists()).toBe(false);

    wrapper.setProps({ network: 'test-network', subnetwork: 'test-network-subnet' });
    await wrapper.vm.$nextTick();
    expect(secondaryRangeNameInput.exists()).toBe(false);

    secondaryRangeDropdown = wrapper.findComponent('[data-testid="gke-cluster-secondary-range-name-select"]');
    expect(secondaryRangeDropdown.exists()).toBe(true);
    expect(secondaryRangeDropdown.props().options).toHaveLength(2);
  });

  it('should auto-populate and disable secondary range CIDR block input if the selected secondary range has one defined already', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project',
        network:           'test-network',
        subnetwork:        'test-network-subnet',
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const clusterSecondaryCIDRInput = wrapper.getComponent('[data-testid="gke-cluster-secondary-range-cidr-input"]');
    const clusterSecondaryRangeSelect = wrapper.getComponent('[data-testid="gke-cluster-secondary-range-name-select"]');

    expect(clusterSecondaryCIDRInput.props('disabled')).toBe(false);
    expect(clusterSecondaryCIDRInput.props('value')).toBe('');
    const opt = {
      ipCidrRange: '10.0.1.0/24',
      label:       'range-1 (10.0.1.0/24)',
      rangeName:   'range-1'
    };

    clusterSecondaryRangeSelect.vm.$emit('update:value', opt);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:clusterSecondaryRangeName')[0][0]).toBe('range-1');
    expect(wrapper.emitted('update:clusterIpv4CidrBlock')[0][0]).toBe('');
    wrapper.setProps({ clusterSecondaryRangeName: 'range-1' });
    await wrapper.vm.$nextTick();

    expect(clusterSecondaryCIDRInput.props('disabled')).toBe(true);
    expect(clusterSecondaryCIDRInput.props('value')).toBe('10.0.1.0/24');

    wrapper.setProps({ clusterSecondaryRangeName: '' });
    await wrapper.vm.$nextTick();

    expect(clusterSecondaryCIDRInput.props('disabled')).toBe(false);
  });

  it('should show a warning banner if useIpAliases is false', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project',
        useIpAliases:      false
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const banner = wrapper.getComponent('[data-testid="gke-use-ip-aliases-banner"]');

    expect(banner.exists()).toBe(true);

    wrapper.setProps({ useIpAliases: true });
    await wrapper.vm.$nextTick();
    expect(banner.exists()).toBe(false);
  });

  it('should enable networkPolicyConfig when networkPolicyEnabled is enabled', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:                 'test-zone',
        region:               'test-region',
        cloudCredentialId:    '',
        projectId:            'test-project',
        networkPolicyEnabled: false
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    wrapper.vm.updateNetworkPolicyEnabled(true);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:networkPolicyEnabled')?.[0]?.[0]).toBe(true);
    expect(wrapper.emitted('update:networkPolicyConfig')?.[0]?.[0]).toBe(true);
  });

  it('should enable networkPolicyEnabled when enableNetworkPolicy is enabled', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project',
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    wrapper.vm.updateEnableNetworkPolicy(true);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:networkPolicyEnabled')?.[0]?.[0]).toBe(true);
    expect(wrapper.emitted('update:enableNetworkPolicy')?.[0]?.[0]).toBe(true);
  });

  it('should show an input for master ipv4 cidr block when private cluster is enabled', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:               'test-zone',
        region:             'test-region',
        cloudCredentialId:  '',
        projectId:          'test-project',
        enablePrivateNodes: false,
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    wrapper.setData({ showAdvanced: true });

    await wrapper.vm.$nextTick();

    let masterIpv4CidrBlockInput = wrapper.findComponent('[data-testid="gke-master-ipv4-cidr-block-input"]');

    expect(masterIpv4CidrBlockInput.exists()).toBe(false);

    wrapper.setProps({ enablePrivateNodes: true });
    await wrapper.vm.$nextTick();

    masterIpv4CidrBlockInput = wrapper.findComponent('[data-testid="gke-master-ipv4-cidr-block-input"]');
    expect(masterIpv4CidrBlockInput.isVisible()).toBe(true);
  });

  it('should disable the private endpoint checkbox when private cluster is disabled', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:               'test-zone',
        region:             'test-region',
        cloudCredentialId:  '',
        projectId:          'test-project',
        enablePrivateNodes: false,
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    wrapper.setData({ showAdvanced: true });
    await wrapper.vm.$nextTick();

    let enablePrivateEndpointCheckbox = wrapper.getComponent('[data-testid="gke-enable-private-endpoint-checkbox"]');

    expect(enablePrivateEndpointCheckbox.props().disabled).toBe(true);

    wrapper.setProps({ enablePrivateNodes: true });
    await wrapper.vm.$nextTick();

    enablePrivateEndpointCheckbox = wrapper.getComponent('[data-testid="gke-enable-private-endpoint-checkbox"]');

    expect(enablePrivateEndpointCheckbox.props().disabled).toBe(false);
  });

  it('should show inputs for master authorized cidr blocks when master authorized network is enabled', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:               'test-zone',
        region:             'test-region',
        cloudCredentialId:  '',
        projectId:          'test-project',
        enablePrivateNodes: false,
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    wrapper.setData({ showAdvanced: true });
    await wrapper.vm.$nextTick();

    let masterAuthorizedNetworkCidrInput = wrapper.findComponent('[data-testid="gke-master-authorized-network-cidr-keyvalue"]');

    expect(masterAuthorizedNetworkCidrInput.exists()).toBe(false);

    wrapper.setProps({ enableMasterAuthorizedNetwork: true });
    await wrapper.vm.$nextTick();
    masterAuthorizedNetworkCidrInput = wrapper.findComponent('[data-testid="gke-master-authorized-network-cidr-keyvalue"]');
    expect(masterAuthorizedNetworkCidrInput.isVisible()).toBe(true);
  });

  it('should allow the user to edit the master authorized network cidr block list for new or existing node pools', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        zone:                          'test-zone',
        region:                        'test-region',
        cloudCredentialId:             '',
        projectId:                     'test-project',
        enablePrivateNodes:            false,
        enableMasterAuthorizedNetwork: true,
        isNewOrUnprovisioned:          false,
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    wrapper.setData({ showAdvanced: true });
    await wrapper.vm.$nextTick();

    const masterAuthorizedNetworkCidrInput = wrapper.findComponent('[data-testid="gke-master-authorized-network-cidr-keyvalue"]');

    expect(masterAuthorizedNetworkCidrInput.isVisible()).toBe(true);
    expect(masterAuthorizedNetworkCidrInput.props().disabled).toBe(false);

    wrapper.setProps({ isNewOrUnprovisioned: true });
    await wrapper.vm.$nextTick();

    expect(masterAuthorizedNetworkCidrInput.props().disabled).toBe(false);
  });
});
