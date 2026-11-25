import { shallowMount } from '@vue/test-utils';
import Endpoints from '@shell/components/formatter/Endpoints.vue';

describe('component: Endpoints', () => {
  const parsedFor = (nodes: object[]) => {
    const wrapper = shallowMount(Endpoints, {
      props: {
        value: JSON.stringify([{ port: 30080 }]), row: {}, col: {}
      },
      global: { mocks: { $store: { getters: { 'cluster/all': () => nodes } } } }
    });

    return (wrapper.vm as any).parsed;
  };

  it('should link to the first external IP of the first node that has one, whichever external IP is shown', () => {
    const nodes = [
      { externalIps: [] },
      { externalIp: '2001:db8::1', externalIps: ['203.0.113.1', '2001:db8::1'] },
      { externalIp: '203.0.113.2', externalIps: ['203.0.113.2'] },
    ];

    expect(parsedFor(nodes)[0].link).toStrictEqual('http://203.0.113.1:30080');
  });

  it('should not link when no node has an external IP', () => {
    const [endpoint] = parsedFor([{ externalIps: [] }]);

    expect(endpoint.link).toBeUndefined();
    expect(endpoint.display).toStrictEqual('[%servicesPage.anyNode%]:30080');
  });
});
