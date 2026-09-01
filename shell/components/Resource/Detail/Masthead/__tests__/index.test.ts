import { mount } from '@vue/test-utils';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import Cards from '@shell/components/Resource/Detail/Cards.vue';

jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn() }));

describe('component: Masthead/index', () => {
  const mockResource = {
    name:  'test-resource',
    cards: []
  };

  const defaultProps = {
    titleBarProps: {
      resource:          mockResource,
      resourceTypeLabel: 'ConfigMap',
      resourceName:      'test-resource'
    },
    metadataProps: { items: [] }
  };

  const globalStubs = {
    stubs: {
      TitleBar: true,
      Metadata: true,
      Cards:    true
    }
  };

  it('should render the Cards component', () => {
    const wrapper = mount(Masthead, {
      props:  defaultProps,
      global: globalStubs
    });

    expect(wrapper.findComponent(Cards).exists()).toBe(true);
  });

  it('should pass the resource from titleBarProps to Cards', () => {
    const wrapper = mount(Masthead, {
      props:  defaultProps,
      global: globalStubs
    });

    const cardsComponent = wrapper.findComponent(Cards);

    expect(cardsComponent.props('resource')).toStrictEqual(mockResource);
  });

  it('should render TitleBar when titleBarProps is provided', () => {
    const wrapper = mount(Masthead, {
      props:  defaultProps,
      global: globalStubs
    });

    expect(wrapper.findComponent(TitleBar).exists()).toBe(true);
  });

  it('should render Metadata when metadataProps is provided', () => {
    const wrapper = mount(Masthead, {
      props:  defaultProps,
      global: globalStubs
    });

    expect(wrapper.findComponent(Metadata).exists()).toBe(true);
  });

  it('should not render TitleBar when titleBarProps is undefined', () => {
    const wrapper = mount(Masthead, {
      props:  { titleBarProps: undefined, metadataProps: { items: [] } },
      global: globalStubs
    });

    expect(wrapper.findComponent(TitleBar).exists()).toBe(false);
  });

  it('should not render Metadata when metadataProps is undefined', () => {
    const wrapper = mount(Masthead, {
      props:  { titleBarProps: defaultProps.titleBarProps, metadataProps: undefined },
      global: globalStubs
    });

    expect(wrapper.findComponent(Metadata).exists()).toBe(false);
  });

  it('should not render Cards when titleBarProps is undefined', () => {
    const wrapper = mount(Masthead, {
      props:  { titleBarProps: undefined, metadataProps: undefined },
      global: globalStubs
    });

    expect(wrapper.findComponent(Cards).exists()).toBe(false);
  });

  it('should not render any children when both props are undefined', () => {
    const wrapper = mount(Masthead, {
      props:  { titleBarProps: undefined, metadataProps: undefined },
      global: globalStubs
    });

    expect(wrapper.findComponent(TitleBar).exists()).toBe(false);
    expect(wrapper.findComponent(Metadata).exists()).toBe(false);
    expect(wrapper.findComponent(Cards).exists()).toBe(false);
  });
});
