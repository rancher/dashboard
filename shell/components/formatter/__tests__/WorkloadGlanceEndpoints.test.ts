import { flushPromises, shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import WorkloadGlanceEndpoints from '@shell/components/formatter/WorkloadGlanceEndpoints.vue';
import Endpoints from '@shell/components/formatter/Endpoints.vue';

const annotation = JSON.stringify([{
  port: 32767, protocol: 'TCP', serviceName: 'default:frontend', allNodes: true
}]);

const gatewayEndpoints = [
  { link: 'http://shop.example.com/shop', linkDisplay: 'http://shop.example.com/shop' },
  { link: 'https://shop.example.com:8443/', linkDisplay: 'https://shop.example.com:8443/' },
];

const createWrapper = (props: any) => shallowMount(WorkloadGlanceEndpoints, {
  props,
  global: { plugins: [createStore({ getters: { 'i18n/t': () => (key: string) => key } })] },
});

const workload = ({ publicEndpoints = [] as any, glanceGatewayEndpoints = [] as any[], fetch = () => Promise.resolve() } = {}) => ({
  publicEndpoints,
  glanceGatewayEndpoints,
  fetchGatewayEndpointResources: jest.fn(fetch),
});

describe('component: WorkloadGlanceEndpoints', () => {
  it('should fetch what the gateway endpoints are worked out from when shown', async() => {
    const row = workload();

    createWrapper({ row });
    await flushPromises();

    expect(row.fetchGatewayEndpointResources).toHaveBeenCalledWith();
  });

  it('should render the public endpoints with the formatter of the workload lists Endpoints column', async() => {
    const row = workload({ publicEndpoints: JSON.parse(annotation) });
    const wrapper = createWrapper({ value: annotation, row });

    await flushPromises();

    expect(wrapper.findComponent(Endpoints).props()).toStrictEqual({
      value: annotation, row, col: {}
    });
  });

  it.each([
    ['there are none', []],
    ['the workload has no public endpoints getter', undefined],
  ])('should not render the public endpoints when %s', async(_, publicEndpoints) => {
    const wrapper = createWrapper({ value: annotation, row: workload({ publicEndpoints }) });

    await flushPromises();

    expect(wrapper.findComponent(Endpoints).exists()).toBe(false);
  });

  it('should show a spinner while the gateway endpoints are fetched', () => {
    const wrapper = createWrapper({ row: workload({ glanceGatewayEndpoints: gatewayEndpoints, fetch: () => new Promise(() => undefined) }) });
    const spinner = wrapper.find('.icon-spinner');

    expect(spinner.exists()).toBe(true);
    expect(spinner.attributes('role')).toStrictEqual('status');
    expect(spinner.attributes('aria-label')).toStrictEqual('component.resource.detail.glance.ariaLabel.loading');
    expect(wrapper.findAll('a.gateway-endpoint')).toHaveLength(0);
    expect(wrapper.text()).toStrictEqual('');
  });

  it('should show the public endpoints while the gateway endpoints are fetched', () => {
    const wrapper = createWrapper({ value: annotation, row: workload({ publicEndpoints: JSON.parse(annotation), fetch: () => new Promise(() => undefined) }) });

    expect(wrapper.findComponent(Endpoints).exists()).toBe(true);
    expect(wrapper.find('.icon-spinner').exists()).toBe(true);
  });

  it('should render a link for each gateway endpoint, in order', async() => {
    const wrapper = createWrapper({ row: workload({ glanceGatewayEndpoints: gatewayEndpoints }) });

    await flushPromises();

    const links = wrapper.findAll('a.gateway-endpoint');

    expect(wrapper.find('.icon-spinner').exists()).toBe(false);
    expect(links.map((link) => [link.attributes('href'), link.text()])).toStrictEqual([
      ['http://shop.example.com/shop', 'http://shop.example.com/shop'],
      ['https://shop.example.com:8443/', 'https://shop.example.com:8443/'],
    ]);
  });

  it('should open a gateway endpoint in a new tab without giving it access to the dashboard', async() => {
    const wrapper = createWrapper({ row: workload({ glanceGatewayEndpoints: [gatewayEndpoints[0]] }) });

    await flushPromises();

    const link = wrapper.find('a.gateway-endpoint');

    expect(link.attributes('target')).toStrictEqual('_blank');
    expect(link.attributes('rel')).toStrictEqual('nofollow noopener noreferrer');
  });

  it('should render the public endpoints before the gateway endpoints', async() => {
    const wrapper = createWrapper({ value: annotation, row: workload({ publicEndpoints: JSON.parse(annotation), glanceGatewayEndpoints: gatewayEndpoints }) });

    await flushPromises();

    const children = Array.from((wrapper.element as HTMLElement).children).map((child) => child.tagName.toLowerCase());

    expect(children).toStrictEqual(['endpoints-stub', 'a', 'a']);
  });

  it('should show only the public endpoints when there are no gateway endpoints', async() => {
    const wrapper = createWrapper({ value: annotation, row: workload({ publicEndpoints: JSON.parse(annotation) }) });

    await flushPromises();

    expect(wrapper.findAll('a.gateway-endpoint')).toHaveLength(0);
    expect(wrapper.text()).toStrictEqual('');
  });

  it('should show a dash when there are neither public nor gateway endpoints', async() => {
    const wrapper = createWrapper({ row: workload() });

    await flushPromises();

    expect(wrapper.find('.icon-spinner').exists()).toBe(false);
    expect(wrapper.text()).toStrictEqual('—');
  });

  it('should show a dash when the gateway endpoints can not be fetched', async() => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const wrapper = createWrapper({ row: workload({ fetch: () => Promise.reject(new Error('forbidden')) }) });

    await flushPromises();

    expect(wrapper.find('.icon-spinner').exists()).toBe(false);
    expect(wrapper.text()).toStrictEqual('—');

    error.mockRestore();
  });

  it('should show a dash when the workload can not fetch gateway endpoints', async() => {
    const wrapper = createWrapper({ row: { publicEndpoints: [] } });

    await flushPromises();

    expect(wrapper.text()).toStrictEqual('—');
  });
});
