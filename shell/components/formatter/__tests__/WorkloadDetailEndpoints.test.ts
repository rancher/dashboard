import { mount } from '@vue/test-utils';
import WorkloadDetailEndpoints from '@shell/components/formatter/WorkloadDetailEndpoints.vue';
import Tag from '@shell/components/Tag';

describe('component: WorkloadDetailEndpoints', () => {
  const withIngressAndHostname = [{
    addresses: [
      '172.18.0.3'
    ],
    port:        80,
    protocol:    'HTTP',
    serviceName: 'kube-public:tetris',
    ingressName: 'kube-public:tetris',
    hostname:    'tetris.kube-public.172.18.0.3.sslip.io',
    path:        '/',
    allNodes:    false,
  }];

  const withoutIngress = [
    {
      addresses: [
        '172.18.0.3'
      ],
      port:        80,
      protocol:    'TCP',
      serviceName: 'kube-system:traefik',
      allNodes:    false
    },
    {
      addresses: [
        '172.18.0.3'
      ],
      port:        443,
      protocol:    'TCP',
      serviceName: 'kube-system:traefik',
      allNodes:    false
    }
  ];

  const withoutAddresses = [
    {
      port:        443,
      protocol:    'TCP',
      serviceName: 'kube-system:traefik',
      allNodes:    false
    }
  ];

  const basicNodesOutput = [
    { externalIp: 'some-external-ip' }
  ];

  it.each([
    [withIngressAndHostname, [], ['http://tetris.kube-public.172.18.0.3.sslip.io/']],
    [withoutIngress, [], ['http://172.18.0.3:80', 'https://172.18.0.3:443']],
    [withoutAddresses, basicNodesOutput, ['https://some-external-ip:443']],
  ])('should display a link given the appropriate conditions', (value:any[], nodesOutput:any[], expectationArr:any[]) => {
    const wrapper = mount(WorkloadDetailEndpoints, {
      props:  { value: JSON.stringify(value) },
      global: { mocks: { $store: { getters: { 'cluster/all': () => nodesOutput } } } }
    });

    wrapper.vm.parsed.forEach((endpoint:{[key: string]: string}, i:number) => {
      expect(endpoint.link).toBe(expectationArr[i]);
    });
  });

  it.each([
    [withoutAddresses, [], ['[%servicesPage.anyNode%]:443']],
  ])('should render a Tag component with the appropriate content', (value:any[], nodesOutput:any[], expectationArr:any[]) => {
    const wrapper = mount(WorkloadDetailEndpoints, {
      props:  { value: JSON.stringify(value) },
      global: { mocks: { $store: { getters: { 'cluster/all': () => nodesOutput } } } }
    });

    wrapper.vm.parsed.forEach((endpoint:{[key: string]: string}, i:number) => {
      expect(endpoint.display).toBe(expectationArr[i]);
      expect(wrapper.findComponent(Tag).exists()).toBe(true);
    });
  });
});
