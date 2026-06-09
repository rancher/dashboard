import { mount, VueWrapper } from '@vue/test-utils';
import InternalExternalIP from '@shell/components/formatter/InternalExternalIP.vue';

jest.mock('clipboard-polyfill', () => ({ writeText: jest.fn() }));

describe('component: InternalExternalIP', () => {
  const mockGetters = {
    'i18n/t': (key: string, args: any) => {
      if (key === 'generic.plusMore') {
        return `+${ args.n } more`;
      }
      if (key === 'internalExternalIP.clickToShowMoreIps') {
        return `Click to show ${ args.count } more IP(s)`;
      }

      return key;
    }
  };

  const mountComponent = (props: any): VueWrapper<any> => {
    return mount(InternalExternalIP, {
      props,
      global: {
        components: { 'v-dropdown': { name: 'v-dropdown', template: '<div><slot /><slot name="popper" /></div>' } },
        directives: {
          'clean-tooltip': (el, binding) => {
            el.setAttribute('v-clean-tooltip', binding.value.content);
          }
        },
        mocks: { $store: { getters: mockGetters } }
      }
    });
  };

  describe('no IPs', () => {
    it('should display placeholders', () => {
      const wrapper = mountComponent({ row: { externalIps: [], internalIps: ['1.1.1.1'] } });

      expect(wrapper.text()).toStrictEqual('- /1.1.1.1');
    });
  });

  describe('single IPs', () => {
    it('should display a single external IP', () => {
      const wrapper = mountComponent({ row: { externalIps: ['1.1.1.1'], internalIps: [] } });

      expect(wrapper.find('[data-testid="external-ip"]').text()).toStrictEqual('1.1.1.1');
      expect(wrapper.find('[data-testid="plus-more"]').exists()).toBe(false);
    });

    it('should display a single internal IP', () => {
      const wrapper = mountComponent({ row: { externalIps: [], internalIps: ['2.2.2.2'] } });

      expect(wrapper.find('[data-testid="internal-ip"]').text()).toStrictEqual('2.2.2.2');
      expect(wrapper.find('[data-testid="plus-more"]').exists()).toBe(false);
    });

    it('should display both external and internal IPs', () => {
      const wrapper = mountComponent({ row: { externalIps: ['1.1.1.1'], internalIps: ['2.2.2.2'] } });

      expect(wrapper.find('[data-testid="external-ip"]').text()).toStrictEqual('1.1.1.1');
      expect(wrapper.find('[data-testid="internal-ip"]').text()).toStrictEqual('2.2.2.2');
      expect(wrapper.find('[data-testid="plus-more"]').exists()).toBe(false);
    });

    it('should display "Same as external" when IPs are the same', () => {
      const wrapper = mountComponent({ row: { externalIps: ['1.1.1.1'], internalIps: ['1.1.1.1'] } });

      expect(wrapper.text()).toContain('tableHeaders.internalIpSameAsExternal');
    });
  });

  describe('multiple IPs', () => {
    it('should show popover with remaining external IPs', async() => {
      const wrapper = mountComponent({ row: { externalIps: ['1.1.1.1', '3.3.3.3'], internalIps: ['2.2.2.2'] } });

      expect(wrapper.find('[data-testid="plus-more"]').text()).toStrictEqual('+1 more');

      const popover = wrapper.find('[data-testid="ip-addresses-popover"]');
      const ipSpans = popover.findAll('.ip-address span');

      expect(ipSpans).toHaveLength(1);
      expect(ipSpans[0].text()).toStrictEqual('3.3.3.3');
      expect(popover.find('[data-testid="internal-ip-list"]').exists()).toBe(false);
    });

    it('should show popover with remaining internal IPs', async() => {
      const wrapper = mountComponent({ row: { externalIps: ['1.1.1.1'], internalIps: ['2.2.2.2', '4.4.4.4'] } });

      expect(wrapper.find('[data-testid="plus-more"]').text()).toStrictEqual('+1 more');

      const popover = wrapper.find('[data-testid="ip-addresses-popover"]');
      const ipSpans = popover.findAll('.ip-address span');

      expect(ipSpans).toHaveLength(1);
      expect(ipSpans[0].text()).toStrictEqual('4.4.4.4');
      expect(popover.find('[data-testid="external-ip-list"]').exists()).toBe(false);
    });

    it('should show popover with remaining external and internal IPs', async() => {
      const wrapper = mountComponent({ row: { externalIps: ['1.1.1.1', '3.3.3.3'], internalIps: ['2.2.2.2', '4.4.4.4'] } });

      expect(wrapper.find('[data-testid="plus-more"]').text()).toStrictEqual('+2 more');

      const popover = wrapper.find('[data-testid="ip-addresses-popover"]');
      const externalIpSpans = popover.find('[data-testid="external-ip-list"]').findAll('.ip-address span');
      const internalIpSpans = popover.find('[data-testid="internal-ip-list"]').findAll('.ip-address span');

      expect(externalIpSpans).toHaveLength(1);
      expect(externalIpSpans[0].text()).toStrictEqual('3.3.3.3');
      expect(internalIpSpans).toHaveLength(1);
      expect(internalIpSpans[0].text()).toStrictEqual('4.4.4.4');
    });
  });

  describe('invalid IPs', () => {
    it('should filter invalid IPs', () => {
      const wrapper = mountComponent({ row: { externalIps: ['1.1.1.1', 'not-an-ip'], internalIps: ['2.2.2.2'] } });

      expect(wrapper.find('[data-testid="external-ip"]').text()).toStrictEqual('1.1.1.1');
      expect(wrapper.find('[data-testid="plus-more"]').exists()).toBe(false);
    });
  });

  describe('isIp validation', () => {
    describe('valid IPv4 addresses', () => {
      it.each([
        ['0.0.0.0'],
        ['1.1.1.1'],
        ['127.0.0.1'],
        ['192.168.1.1'],
        ['10.0.0.1'],
        ['255.255.255.255'],
        ['172.16.0.1'],
      ])('should accept %s as a valid IP', (ip) => {
        const wrapper = mountComponent({ row: { externalIps: [ip], internalIps: [] } });

        expect(wrapper.vm.filteredExternalIps).toStrictEqual([ip]);
        expect(wrapper.find('[data-testid="external-ip"]').text()).toStrictEqual(ip);
      });
    });

    describe('valid IPv6 addresses', () => {
      it.each([
        ['::1'],
        ['::'],
        ['fe80::1'],
        ['2001:0db8:85a3:0000:0000:8a2e:0370:7334'],
        ['2001:db8::1'],
        ['::ffff:192.168.1.1'],
      ])('should accept %s as a valid IP', (ip) => {
        const wrapper = mountComponent({ row: { externalIps: [ip], internalIps: [] } });

        expect(wrapper.vm.filteredExternalIps).toStrictEqual([ip]);
        expect(wrapper.find('[data-testid="external-ip"]').text()).toStrictEqual(ip);
      });
    });

    describe('invalid values', () => {
      it.each([
        ['not-an-ip'],
        ['abc.def.ghi.jkl'],
        ['999.999.999.999'],
        ['1.2.3'],
        ['1.2.3.4.5'],
        [''],
        ['hello'],
        ['192.168.1'],
        ['192.168.1.1.1'],
        ['1.2.3.4/24'],
      ])('should reject %s as an invalid IP', (ip) => {
        const wrapper = mountComponent({ row: { externalIps: [ip], internalIps: [] } });

        expect(wrapper.vm.filteredExternalIps).toStrictEqual([]);
        expect(wrapper.find('[data-testid="external-ip"]').exists()).toBe(false);
      });
    });

    it('should filter invalid IPs from internal IPs list', () => {
      const wrapper = mountComponent({ row: { externalIps: [], internalIps: ['10.0.0.1', 'bad-ip', '192.168.1.1'] } });

      expect(wrapper.vm.filteredInternalIps).toStrictEqual(['10.0.0.1', '192.168.1.1']);
      expect(wrapper.find('[data-testid="internal-ip"]').text()).toStrictEqual('10.0.0.1');
      expect(wrapper.vm.remainingIpCount).toStrictEqual(1);
    });

    it('should filter all invalid IPs leaving no results', () => {
      const wrapper = mountComponent({ row: { externalIps: ['not-valid', 'also-bad'], internalIps: ['nope'] } });

      expect(wrapper.vm.filteredExternalIps).toStrictEqual([]);
      expect(wrapper.vm.filteredInternalIps).toStrictEqual([]);
      expect(wrapper.find('[data-testid="external-ip"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="internal-ip"]').exists()).toBe(false);
    });

    it('should handle mixed valid and invalid IPs preserving only valid ones', () => {
      const wrapper = mountComponent({
        row: {
          externalIps: ['1.1.1.1', 'garbage', '8.8.8.8', '999.0.0.1'],
          internalIps: ['10.0.0.1', '', '172.16.0.1', 'abc']
        }
      });

      expect(wrapper.vm.filteredExternalIps).toStrictEqual(['1.1.1.1', '8.8.8.8']);
      expect(wrapper.vm.filteredInternalIps).toStrictEqual(['10.0.0.1', '172.16.0.1']);
      expect(wrapper.find('[data-testid="external-ip"]').text()).toStrictEqual('1.1.1.1');
      expect(wrapper.find('[data-testid="internal-ip"]').text()).toStrictEqual('10.0.0.1');
      expect(wrapper.vm.remainingIpCount).toStrictEqual(2);
    });

    it('should handle undefined externalIps gracefully', () => {
      const wrapper = mountComponent({ row: { internalIps: ['1.1.1.1'] } });

      expect(wrapper.vm.filteredExternalIps).toStrictEqual([]);
    });

    it('should handle undefined internalIps gracefully', () => {
      const wrapper = mountComponent({ row: { externalIps: ['1.1.1.1'] } });

      expect(wrapper.vm.filteredInternalIps).toStrictEqual([]);
    });
  });

  describe('tooltip', () => {
    it('should display the correct tooltip text', () => {
      const wrapper = mountComponent({ row: { externalIps: ['1.1.1.1', '3.3.3.3'], internalIps: ['2.2.2.2', '4.4.4.4'] } });
      const badge = wrapper.find('[data-testid="plus-more"]');

      expect(badge.attributes('v-clean-tooltip')).toBe('Click to show 2 more IP(s)');
    });
  });
});
