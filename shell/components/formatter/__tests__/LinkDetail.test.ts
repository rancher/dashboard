import { mount, RouterLinkStub } from '@vue/test-utils';
import LinkDetail from '@shell/components/formatter/LinkDetail.vue';

describe('component: LinkDetail', () => {
  it('should display the value', async() => {
    const location = 'route-somewhere';
    const wrapper = await mount(LinkDetail, {
      props:  { row: { detailLocation: location }, value: 'test-name' },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    const link = wrapper.findComponent(RouterLinkStub);

    expect(link.text()).toBe('test-name');
  });

  it('should use rows detailLocation to render a link', async() => {
    const location = 'route-somewhere';
    const wrapper = await mount(LinkDetail, {
      props:  { row: { detailLocation: location } },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    const link = wrapper.findComponent(RouterLinkStub);

    expect(link.props().to).toBe(location);
  });

  it('should render the value in a span if no location is provided', async() => {
    const wrapper = await mount(LinkDetail, {
      props: {
        row: { detailLocation: null }, value: 'test-name', col: { }
      },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });
    const span = wrapper.find('span span');

    const link = wrapper.findComponent(RouterLinkStub);

    expect(link.exists()).toBe(false);

    expect(span.element.innerHTML).toContain('test-name');
  });

  it('should use getCustomDetailLink if defined', async() => {
    const location = 'route-somewhere';
    const wrapper = await mount(LinkDetail, {
      props: {
        row: { detailLocation: location }, value: 'test-name', col: { }, getCustomDetailLink: () => 'custom-link'
      },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    const link = wrapper.findComponent(RouterLinkStub);

    expect(link.props().to).toBe('custom-link');
  });

  it('should use reference to find location if defined', async() => {
    const location = 'route-somewhere';
    const wrapper = await mount(LinkDetail, {
      props: {
        row: { detailLocation: location, otherKey: 'other-location' }, value: 'test-name', col: { }, reference: 'otherKey'
      },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    const link = wrapper.findComponent(RouterLinkStub);

    expect(link.props().to).toBe('other-location');
  });
});
