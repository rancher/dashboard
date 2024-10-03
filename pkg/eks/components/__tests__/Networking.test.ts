
/* eslint-disable jest/no-mocks-import */
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { shallowMount } from '@vue/test-utils';
import Networking from '../Networking.vue';

import SecurityGroupData from '../__mocks__/describeSecurityGroups.js';
import SubnetData from '../__mocks__/describeSubnets';
import VpcData from '../__mocks__/describeVpcs';

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
      'i18n/t': (text: string) => text,
      t:        (text: string) => text,
    },
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

describe('eKS Networking', () => {
  it('should allow the user to add endpoints when public access is checked', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {},
      ...setup
    });

    const publicAccessSources = wrapper.getComponent('[data-testid="eks-public-access-sources"]');

    expect(publicAccessSources.vm.addAllowed).toBe(false);

    wrapper.setProps({ publicAccess: true });
    await wrapper.vm.$nextTick();
    expect(publicAccessSources.vm.addAllowed).toBe(true);
  });

  it('should show a vpc and subnet selector when the select from existing subnets radio option is selected', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: { mode: _CREATE },
      ...setup
    });

    wrapper.setData({ chooseSubnet: true });
    await wrapper.vm.$nextTick();
    const subnetDropdown = wrapper.findComponent('[data-testid="eks-subnets-dropdown"]');

    expect(subnetDropdown.exists()).toBe(true);

    wrapper.setData({ chooseSubnet: false });
    await wrapper.vm.$nextTick();
    expect(subnetDropdown.exists()).toBe(false);
  });

  it('should show a list of subnets in use if a cluster has already provisioned and the \'create automatically\' vpc option was selected', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: {
        mode: _EDIT, subnets: [], statusSubnets: ['bc', 'def']
      },
      ...setup
    });

    await wrapper.vm.$nextTick();

    const subnetDropdown = wrapper.findComponent('[data-testid="eks-subnets-dropdown"]');

    expect(subnetDropdown.exists()).toBe(true);

    expect(subnetDropdown.props().value).toStrictEqual(['bc', 'def']);
  });

  // this tests dropdown visibility - contents of dropdown are tested further down
  it('should show a dropdown of security groups when the select from existing subnets radio option is selected', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Networking, {
      propsData: { mode: _CREATE },
      ...setup
    });

    wrapper.setData({ chooseSubnet: true });
    await wrapper.vm.$nextTick();
    const sgDropDown = wrapper.findComponent('[data-testid="eks-security-groups-dropdown"]');

    expect(sgDropDown.exists()).toBe(true);

    wrapper.setData({ chooseSubnet: false });
    await wrapper.vm.$nextTick();
    expect(sgDropDown.exists()).toBe(false);
  });

  it('should fetch VPCs and securityGroups when a credential is provided or changes', async() => {
    const setup = requiredSetup();

    // eslint-disable-next-line prefer-const
    let wrapper: any;

    const fetchGroupsSpy = jest.spyOn(Networking.methods, 'fetchSecurityGroups').mockImplementation(() => {
      wrapper.setData({ securityGroupInfo: SecurityGroupData });
    });

    const fetchVpcsSpy = jest.spyOn(Networking.methods, 'fetchVpcs').mockImplementation(() => {
      wrapper.setData({ subnetInfo: SubnetData, vpcInfo: VpcData });
    });

    wrapper = shallowMount(Networking, {
      propsData: { mode: _CREATE },
      ...setup
    });

    wrapper.setProps({ amazonCredentialSecret: 'abc' });
    await wrapper.vm.$nextTick();

    expect(fetchGroupsSpy).toHaveBeenCalledTimes(1);
    expect(fetchVpcsSpy).toHaveBeenCalledTimes(1);

    wrapper.setProps({ amazonCredentialSecret: 'def' });
    await wrapper.vm.$nextTick();

    expect(fetchGroupsSpy).toHaveBeenCalledTimes(2);
    expect(fetchVpcsSpy).toHaveBeenCalledTimes(2);
  });

  it('should populate the security group dropdown with groups in the same vpc as the selected subnet', async() => {
    const setup = requiredSetup();

    // eslint-disable-next-line prefer-const
    let wrapper: any;

    jest.spyOn(Networking.methods, 'fetchSecurityGroups').mockImplementation(() => {
      wrapper.setData({ securityGroupInfo: SecurityGroupData });
    });

    jest.spyOn(Networking.methods, 'fetchVpcs').mockImplementation(() => {
      wrapper.setData({ subnetInfo: SubnetData, vpcInfo: VpcData });
    });

    wrapper = shallowMount(Networking, {
      propsData: { mode: _CREATE },
      ...setup
    });

    wrapper.setProps({ amazonCredentialSecret: 'abc' });
    wrapper.setData({ chooseSubnet: true });

    await wrapper.vm.$nextTick();

    const sgDropDown = wrapper.getComponent('[data-testid="eks-security-groups-dropdown"]');

    expect(sgDropDown.props().options).toStrictEqual([]);

    wrapper.setProps({ subnets: ['subnet-1234'] });
    await wrapper.vm.$nextTick();
    expect(sgDropDown.props().options).toStrictEqual([{ label: 'group0-name (group0-id)', value: 'group0-id' }, { label: 'group1-name (group1-id)', value: 'group1-id' }]);

    wrapper.setProps({ subnets: ['subnet-4321'] });
    await wrapper.vm.$nextTick();
    expect(sgDropDown.props().options).toStrictEqual([{ label: 'group2-name (group2-id)', value: 'group2-id' }]);
  });

  it('should clear any selected security groups when the selected vpc changes', async() => {
    const setup = requiredSetup();

    // eslint-disable-next-line prefer-const
    let wrapper: any;

    jest.spyOn(Networking.methods, 'fetchSecurityGroups').mockImplementation(() => {
      wrapper.setData({ securityGroupInfo: SecurityGroupData });
    });

    jest.spyOn(Networking.methods, 'fetchVpcs').mockImplementation(() => {
      wrapper.setData({ subnetInfo: SubnetData, vpcInfo: VpcData });
    });

    wrapper = shallowMount(Networking, {
      propsData: {
        mode: _CREATE, subnets: ['subnet-1234'], securityGroups: ['group0-id']
      },
      ...setup
    });

    wrapper.setProps({ amazonCredentialSecret: 'abc' });
    wrapper.setData({ chooseSubnet: true });

    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:securityGroups')).toBeUndefined();

    wrapper.setProps({ subnets: ['subnet-12345'] });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:securityGroups')[0][0]).toStrictEqual([]);
  });

  it('should not allow the user to select subnets in different vpcs', async() => {
    const setup = requiredSetup();

    // eslint-disable-next-line prefer-const
    let wrapper: any;

    jest.spyOn(Networking.methods, 'fetchSecurityGroups').mockImplementation(() => {
      wrapper.setData({ securityGroupInfo: SecurityGroupData });
    });

    jest.spyOn(Networking.methods, 'fetchVpcs').mockImplementation(() => {
      wrapper.setData({ subnetInfo: SubnetData, vpcInfo: VpcData });
    });

    wrapper = shallowMount(Networking, {
      propsData: { mode: _CREATE, subnets: ['subnet-1234'] },
      ...setup
    });

    wrapper.setProps({ amazonCredentialSecret: 'abc' });
    wrapper.setData({ chooseSubnet: true });

    await wrapper.vm.$nextTick();
    const subnetDropdown = wrapper.getComponent('[data-testid="eks-subnets-dropdown"]');

    let subnetOpts = subnetDropdown.props().options;

    expect(subnetOpts.filter((opt) => !opt.disabled && opt.kind !== 'group')).toHaveLength(2);

    // check that adding a subnet in the same vpc doesnt change the selectable subnet options
    wrapper.setProps({ subnets: ['subnet-4321', 'subnet-1234'] });
    await wrapper.vm.$nextTick();

    subnetOpts = subnetDropdown.props().options;
    expect(subnetOpts.filter((opt) => !opt.disabled && opt.kind !== 'group')).toHaveLength(2);

    // check that when subnets are empty, no options are disabled
    wrapper.setProps({ subnets: [] });
    await wrapper.vm.$nextTick();

    subnetOpts = subnetDropdown.props().options;
    expect(subnetOpts.filter((opt) => opt.disabled && opt.kind !== 'group')).toHaveLength(0);

    // check that selecting a subnet in a different vpc changes which options are disabled
    wrapper.setProps({ subnets: ['subnet-12'] });
    await wrapper.vm.$nextTick();

    subnetOpts = subnetDropdown.props().options;
    expect(subnetOpts.filter((opt) => opt.disabled && opt.kind !== 'group')).toHaveLength(5);
  });
});
