import { shallowMount } from '@vue/test-utils';
import EC2Networking from '@shell/machine-config/components/EC2Networking.vue';

import { vpcInfo, subnetInfo } from './utils/vpcSubnetMockData';

describe('component: EC2Networking', () => {
  const defaultGetters = { 'i18n/t': jest.fn().mockImplementation((key: string) => key) };
  const baseSetup = {
    propsData: {
      region:       '',
      zone:         'us-west-2a',
      machinePools: [],
      vpcInfo,
      subnetInfo

    },
    global: {
      mocks: {
        t:           (key: string) => key,
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
      mode: 'create',
    }
  };

  it('should render a dropdown containing ipv4-only subnets and vpcs', () => {
    const wrapper = shallowMount(EC2Networking, defaultCreateSetup);
    const expectedValues = ['vpc-1234', 'vpc-123'];
    const networkOptionValues = wrapper.vm.networkOptions.map((o:any) => o.value);

    expect(networkOptionValues).toStrictEqual(expectedValues);
  });

  it('should update the network dropdown to contain ipv6 and dual stack vpcs/subnets when the ipv6 checkbox is checked', async() => {
    const wrapper = shallowMount(EC2Networking, defaultCreateSetup);

    const ipv6Checkbox = wrapper.findComponent('[data-testid="amazonEc2__enableIpv6"]');

    ipv6Checkbox.vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();
    const expectedValues = ['vpc-12345', 'subnet-4321'];
    const networkOptionValues = wrapper.vm.networkOptions.map((o:any) => o.value);

    expect(networkOptionValues).toStrictEqual(expectedValues);
  });

  it('should render the ipv6 address count input when the enable ipv6 checkbox is checked', async() => {
    const wrapper = shallowMount(EC2Networking, defaultCreateSetup);
    const ipv6Checkbox = wrapper.findComponent('[data-testid="amazonEc2__enableIpv6"]');

    ipv6Checkbox.vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();

    const ipv6AddressCountInput = wrapper.findComponent('[data-testid="amazonEc2__ipv6AddressCount"]');

    expect(wrapper.vm.enableIpv6).toBe(true);
    expect(ipv6AddressCountInput.exists()).toBe(true);
  });

  it('should render the ipv6 only checkbox when the selected network is dual-stack', async() => {
    const wrapper = shallowMount(EC2Networking, defaultCreateSetup);

    await wrapper.setData({ enableIpv6: true, selectedNetwork: 'vpc-12345' });

    const ipv6OnlyCheckbox = wrapper.findComponent('[data-testid="amazonEc2__ipv6AddressOnly"]');

    expect(ipv6OnlyCheckbox.exists()).toBe(true);
  });

  it.each([
    [[{ isIpv6: true }, { isIpv6: false }], true, true],
    [[{ isIpv6: false, isDualStack: true }, { isIpv6: false, isDualStack: false }], true, false],
    [[{ isIpv6: true, isDualStack: false }, { isIpv6: false, isDualStack: true }], false, true],
    [[{ isIpv6: false, isDualStack: false }, { isIpv6: false, isDualStack: false }], false, false],
    [[{ isIpv6: true, isDualStack: false }, { isIpv6: true, isDualStack: false }], false, false],
    [[{ isIpv6: false, isDualStack: true }, { isIpv6: false, isDualStack: true }], false, false],
  ])('should show the correct warning banner based on mixed machine pool network modes', (pools, shouldShowDualStackWarning, shouldShowIpv6Warning) => {
    const wrapper = shallowMount(EC2Networking, { ...defaultCreateSetup, propsData: { ...defaultCreateSetup.propsData, machinePools: pools } });
    const dualStackWarning = wrapper.findComponent('[data-testid="amazonEc2__dualStackWarning"]');
    const ipv6Warning = wrapper.findComponent('[data-testid="amazonEc2__ipv6Warning"]');

    expect(dualStackWarning.exists()).toBe(shouldShowDualStackWarning);
    expect(ipv6Warning.exists()).toBe(shouldShowIpv6Warning);
  });

  it('should show ipv6 inputs and automatically check the enable ipv6 checkbox when adding a new pool if some other pool in the cluster is using ipv6 or dual stack', () => {
    const wrapper = shallowMount(EC2Networking, {
      ...defaultCreateSetup,
      propsData: {
        ...defaultCreateSetup.propsData,
        machinePools: [{ isIpv6: true }],
      },
    });

    const ipv6AddressCountInput = wrapper.findComponent('[data-testid="amazonEc2__ipv6AddressCount"]');

    expect(wrapper.vm.enableIpv6).toBe(true);
    expect(ipv6AddressCountInput.exists()).toBe(true);
  });

  it('should not show ipv6 inputs or automatically check the enable ipv6 checkbox when adding a new pool to a cluster that does not have existing ipv6 or dual stack pools', () => {
    const wrapper = shallowMount(EC2Networking, {
      ...defaultCreateSetup,
      propsData: {
        ...defaultCreateSetup.propsData,
        machinePools: [{ isIpv6: false }],
      },
    });

    const ipv6AddressCountInput = wrapper.findComponent('[data-testid="amazonEc2__ipv6AddressCount"]');

    expect(wrapper.vm.enableIpv6).toBe(false);
    expect(ipv6AddressCountInput.exists()).toBe(false);
  });

  it('should emit a validationChanged: false event when created with ipv6 enabled while some other pools have ipv6 disabled', async() => {
    const wrapper = shallowMount(EC2Networking, {
      ...defaultCreateSetup,
      propsData: {
        ...defaultCreateSetup.propsData,
        machinePools: [{ isIpv6: true }, { isIpv6: false }],
      },
    });

    expect(wrapper.emitted('validationChanged')?.[0][0]).toBe(false);
  });

  it('should emit a validationChanged: true event when created with ipv6 enabled while all other pools also have ipv6 enabled', async() => {
    const wrapper = shallowMount(EC2Networking, {
      ...defaultCreateSetup,
      propsData: {
        ...defaultCreateSetup.propsData,
        machinePools: [{ isIpv6: true }, { isIpv6: true }],
      },
    });

    expect(wrapper.emitted('validationChanged')?.[0][0]).toBe(true);
  });

  it('should emit a validationChanged: false event when ipv6-only and dual-stack pools are mixed', async() => {
    const wrapper = shallowMount(EC2Networking, {
      ...defaultCreateSetup,
      propsData: {
        ...defaultCreateSetup.propsData,
        machinePools: [{ isIpv6: true, isDualStack: false }, { isIpv6: false, isDualStack: true }],
      },
    });

    expect(wrapper.emitted('validationChanged')?.[0][0]).toBe(false);
  });

  it('should emit a validationChanged: true event when all pools are dual-stack', async() => {
    const wrapper = shallowMount(EC2Networking, {
      ...defaultCreateSetup,
      propsData: {
        ...defaultCreateSetup.propsData,
        machinePools: [{ isIpv6: false, isDualStack: true }, { isIpv6: false, isDualStack: true }],
      },
    });

    expect(wrapper.emitted('validationChanged')?.[0][0]).toBe(true);
  });
});
