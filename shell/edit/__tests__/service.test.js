import Service from '@shell/edit/service.vue';
import { CLUSTERIP, EXTERNALIP } from '@shell/models/service';
import { shallowMount } from '@vue/test-utils';

describe('edit: service', () => {
  it('should return the correct value for the computed prop isExternalIP', () => {
    const localThis1 = {
      value: {
        spec: {
          type:      CLUSTERIP,
          clusterIP: 'None'
        },
        metadata: { annotations: { 'field.cattle.io/ipAddresses': '["10.1.1.2"]' } }
      }
    };

    expect(!!Service.computed.isExternalIP.call(localThis1)).toBe(true);

    const localThis2 = { selectedServiceType: EXTERNALIP };

    expect(Service.computed.isExternalIP.call(localThis2)).toBe(true);
  });

  it('should contain external ip address form', () => {
    const mockT = jest.fn();

    shallowMount(Service, {
      directives: { cleanHtml: jest.fn() },
      propsData:  {
        value: {
          spec: {
            type:      CLUSTERIP,
            clusterIP: 'None'
          },
          metadata: { annotations: { 'field.cattle.io/ipAddresses': '["10.1.1.2"]' } }
        }
      },
      mocks: {
        $route: { name: 'test' },
        $store: {
          getters: {
            'management/all': jest.fn(() => []),
            'i18n/t':         mockT
          },

        }
      }
    });

    expect(mockT).toHaveBeenCalledWith('servicesPage.ips.external.label', undefined);
  });
});
