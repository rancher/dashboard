import { mount } from '@vue/test-utils';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
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

  it('should render the Cards component', () => {
    const wrapper = mount(Masthead, {
      props:  defaultProps,
      global: {
        stubs: {
          TitleBar: true,
          Metadata: true,
          Cards:    true
        }
      }
    });

    expect(wrapper.findComponent(Cards).exists()).toBe(true);
  });

  it('should pass the resource from titleBarProps to Cards', () => {
    const wrapper = mount(Masthead, {
      props:  defaultProps,
      global: {
        stubs: {
          TitleBar: true,
          Metadata: true,
          Cards:    true
        }
      }
    });

    const cardsComponent = wrapper.findComponent(Cards);

    expect(cardsComponent.props('resource')).toStrictEqual(mockResource);
  });
});
