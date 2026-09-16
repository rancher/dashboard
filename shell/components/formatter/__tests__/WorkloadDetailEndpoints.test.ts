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

    expect(wrapper.vm.parsed).toHaveLength(expectationArr.length);
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

    expect(wrapper.vm.parsed).toHaveLength(expectationArr.length);
    wrapper.vm.parsed.forEach((endpoint:{[key: string]: string}, i:number) => {
      expect(endpoint.display).toBe(expectationArr[i]);
      expect(wrapper.findComponent(Tag).exists()).toBe(true);
    });
  });

  const mount_ = (value: any, nodesOutput: any[] = []) => mount(WorkloadDetailEndpoints, {
    props:  { value },
    global: { mocks: { $store: { getters: { 'cluster/all': () => nodesOutput } } } }
  });

  it('should accept an array as well as the annotation string', () => {
    const asArray = mount_(withIngressAndHostname);
    const asString = mount_(JSON.stringify(withIngressAndHostname));

    expect(asArray.vm.parsed).toStrictEqual(asString.vm.parsed);
    expect(asArray.vm.parsed[0].link).toBe('http://tetris.kube-public.172.18.0.3.sslip.io/');
  });

  it('should leave an endpoint that already carries a link untouched', () => {
    const resolved = { link: 'http://demo.example.com/shop', linkDisplay: 'http://demo.example.com/shop' };

    const wrapper = mount_([resolved]);

    expect(wrapper.vm.parsed).toStrictEqual([resolved]);
    expect(wrapper.find('a').attributes('href')).toBe('http://demo.example.com/shop');
  });

  it('should render published endpoints alongside pre-resolved ones', () => {
    const resolved = { link: 'http://demo.example.com/shop', linkDisplay: 'http://demo.example.com/shop' };

    const wrapper = mount_([...withIngressAndHostname, resolved]);

    expect(wrapper.vm.parsed.map((e: any) => e.link)).toStrictEqual([
      'http://tetris.kube-public.172.18.0.3.sslip.io/',
      'http://demo.example.com/shop',
    ]);
  });

  it.each([
    ['an empty array', []],
    ['an empty string', ''],
    ['null', null],
  ])('should parse nothing for %s', (_label, value) => {
    expect(mount_(value).vm.parsed).toBeNull();
  });

  it('should parse nothing for a malformed annotation rather than rendering one character of it', () => {
    expect(mount_('not json').vm.parsed).toBeNull();
  });
});
