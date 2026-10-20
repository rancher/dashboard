import { shallowMount } from '@vue/test-utils';
import azure from '@shell/machine-config/azure.vue';
import { _CREATE } from '@shell/config/query-params';

const VM_SIZE = 'Standard_D2_v2';

const vmSize = (name: string, availabilityZones: string[]) => ({
  Name:                           name,
  AcceleratedNetworkingSupported: false,
  AvailabilityZones:              availabilityZones,
});

describe('component: azure', () => {
  const createWrapper = (data: Record<string, unknown>) => shallowMount(azure, {
    propsData: {
      credentialId: 'credentialId',
      uuid:         'uuid',
      mode:         _CREATE,
      value:        { size: VM_SIZE },
    },
    data:   () => data,
    global: {
      mocks: {
        $fetch:      jest.fn(),
        $fetchState: { pending: false },
        $store:      { getters: { 'i18n/t': (key: string) => key } },
      },
    },
  });

  describe('availability zone validation', () => {
    it.each([
      [
        'invalid when availability zones are selected and the region has none',
        { vmSizes: [vmSize(VM_SIZE, [])] },
        false,
      ],
      [
        'invalid when availability zones are selected and the region has none for the selected size',
        { vmSizes: [vmSize(VM_SIZE, []), vmSize('Standard_D2s_v3', ['1'])] },
        false,
      ],
      [
        'valid when availability zones are selected and the selected size has zones',
        { vmSizes: [vmSize(VM_SIZE, ['1', '2', '3'])] },
        true,
      ],
      [
        'valid when an availability set is selected',
        { useAvailabilitySet: true },
        true,
      ],
    ])('should emit validationChanged on mount as %s', (_, initialData, expected) => {
      const wrapper = createWrapper(initialData);

      expect(wrapper.emitted('validationChanged')).toStrictEqual([[expected]]);
    });

    it.each([
      [
        'invalid when availability zones are selected and the region has none',
        { useAvailabilitySet: true },
        { useAvailabilitySet: false, vmSizes: [vmSize(VM_SIZE, [])] },
        false,
      ],
      [
        'invalid when availability zones are selected and the region has none for the selected size',
        { useAvailabilitySet: true },
        { useAvailabilitySet: false, vmSizes: [vmSize(VM_SIZE, []), vmSize('Standard_D2s_v3', ['1'])] },
        false,
      ],
      [
        'valid when availability zones are selected and the selected size has zones',
        {},
        { vmSizes: [vmSize(VM_SIZE, ['1', '2', '3'])] },
        true,
      ],
      [
        'valid when an availability set is selected',
        {},
        { useAvailabilitySet: true },
        true,
      ],
    ])('should emit validationChanged again when the selection becomes %s', async(_, initialData, newData, expected) => {
      const wrapper = createWrapper(initialData);

      await wrapper.setData(newData);

      expect(wrapper.emitted('validationChanged')).toStrictEqual([[!expected], [expected]]);
    });
  });
});
