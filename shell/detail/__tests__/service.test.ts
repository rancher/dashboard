import service from '@shell/detail/service.vue';
import { shallowMount } from '@vue/test-utils';

describe('view: service', () => {
  const mockStore = {
    getters: {
      'cluster/schemaFor':   () => {},
      'type-map/headersFor': jest.fn(),
      'i18n/t':              (text: string) => text,
    },
  };

  const mocks = { $store: mockStore };

  it('should return default empty array of ports if the ports are not configured', () => {
    const wrapper = shallowMount(service, {
      props: {
        value: {
          spec: {}, metadata: {}, pods: []
        }
      },
      global: { mocks },
    });

    expect(wrapper.vm.ports).toStrictEqual([]);
  });

  it('should return empty array of ports if ports are set to empty array', () => {
    const wrapper = shallowMount(service, {
      props: {
        value: {
          spec: { ports: [] }, metadata: {}, pods: []
        }
      },
      global: { mocks },
    });

    expect(wrapper.vm.ports).toStrictEqual([]);
  });

  it('should return the correct array of ports if the ports are configured', () => {
    const ports = [
      {
        name: 'test1', port: 80, protocol: 'TCP', targetPort: 80
      },
      {
        name: 'test2', port: 81, protocol: 'TCP', targetPort: 81
      }
    ];

    const wrapper = shallowMount(service, {
      props: {
        value: {
          spec: { ports }, metadata: {}, pods: []
        }
      },
      global: { mocks },
    });

    expect(wrapper.vm.ports).toStrictEqual(ports.map((p) => ({ ...p, publicPorts: [] })));
  });
});
