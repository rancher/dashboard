import { mount, shallowMount } from '@vue/test-utils';
import EC2Networking from '@shell/machine-config/components/EC2Networking.vue';

import SubnetData from '../__mocks__/describeSubnets';
import VpcData from '../__mocks__/describeVpcs';

describe('component: EC2Networking', () => {
  const defaultGetters = { 'i18n/t': jest.fn().mockImplementation((key: string) => key) };
  const poolId = 'poolId';
  const baseSetup = {
    propsData: {
      poolId,
      region:       '',
      zone:         'us-west-2a',
      machinePools: [],
      vpcInfo:      VpcData,
      subnetInfo:   SubnetData

    },
    global: {
      mocks: {
        $fetchState: { pending: false },
        $store:      { getters: defaultGetters },
      },
      stubs: { CodeMirror: true },
    }
  };
  const defaultCreateSetup = {
    ...baseSetup,
    propsData: {
      ...baseSetup.propsData,
      mode:           'create',
      poolCreateMode: true,
      value:          { initted: false },
    }
  };

  it('should render a dropdown containing ipv4-only subnets and vpcs', () => {
    const wrapper = shallowMount(EC2Networking, defaultCreateSetup);

    expect(wrapper.vm.networkOptions).toHaveLength(6);
  });

  it('should update the network dropdown to contain ipv6 and dual stack vpcs/subnets when the ipv6 checkbox is checked', async() => {
    const wrapper = shallowMount(EC2Networking, defaultCreateSetup);

    const ipv6Checkbox = wrapper.findComponent('[data-testid="amazonEc2__enableIpv6"]');

    ipv6Checkbox.vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.networkOptions).toHaveLength(2);
  });

  it('should render the ipv6 address count input when the enable ipv6 checkbox is checked', async() => {
    const wrapper = mount(EC2Networking, defaultCreateSetup);
    const ipv6Checkbox = wrapper.findComponent('[data-testid="amazonEc2__enableIpv6"]');

    ipv6Checkbox.vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const ipv6AddressCountInput = wrapper.findComponent('[data-testid="amazonEc2__ipv6AddressCount"]');

    expect(ipv6AddressCountInput.exists()).toBe(true);
  });
});
